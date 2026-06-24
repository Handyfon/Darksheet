#!/usr/bin/env python3
"""Prompt to publish a Darksheet GitHub release to Foundry."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import threading
import time
import tkinter as tk
import traceback
import urllib.error
import urllib.request
from pathlib import Path
from tkinter import messagebox, ttk


OWNER_REPO = "Handyfon/Darksheet"
WORKFLOW_FILE = "foundry-package-release.yml"
FOUNDRY_PACKAGE_ID = "Darksheet"


class ReleaseInfo:
    def __init__(self, version: str, source: str) -> None:
        self.version = version
        self.source = source

    @property
    def display(self) -> str:
        if self.version:
            return f"{self.version} ({self.source})"
        return self.source


def load_manifest(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"Manifest not found: {path}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Manifest is not valid JSON: {path}\n{exc}") from exc


def default_notes_url(version: str) -> str:
    return f"https://github.com/{OWNER_REPO}/releases/tag/v{version}"


def get_field(manifest: dict, key: str, default: str = "") -> str:
    value = manifest.get(key, default)
    return "" if value is None else str(value)


def get_compat(manifest: dict, key: str, default: str = "") -> str:
    value = manifest.get("compatibility", {}).get(key, default)
    return "" if value is None else str(value)


def normalize_version(value: str) -> str:
    return value.strip().lstrip("v")


def version_sort_key(version: str) -> tuple:
    parts = re.split(r"[.\-+]", normalize_version(version))
    key = []
    for part in parts:
        key.append((0, int(part)) if part.isdigit() else (1, part))
    return tuple(key)


def extract_version_from_payload(text: str) -> str:
    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        payload = None

    if isinstance(payload, dict):
        for key in ("version", "latestVersion", "latest_version"):
            if payload.get(key):
                return normalize_version(str(payload[key]))
        releases = payload.get("releases") or payload.get("versions")
        if isinstance(releases, list):
            versions = [normalize_version(str(item.get("version", ""))) for item in releases if isinstance(item, dict)]
            versions = [version for version in versions if version]
            if versions:
                return sorted(versions, key=version_sort_key)[-1]

    patterns = [
        r'"version"\s*:\s*"([^"]+)"',
        r'Latest\s+Version\s*</[^>]+>\s*<[^>]+>\s*v?([0-9][^<\s]+)',
        r'Version\s*</[^>]+>\s*<[^>]+>\s*v?([0-9][^<\s]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return normalize_version(match.group(1))
    return ""


def fetch_foundry_package_version(package_id: str) -> ReleaseInfo:
    urls = [
        f"https://foundryvtt.com/packages/{package_id}/",
        f"https://foundryvtt.com/packages/{package_id}/module.json",
        f"https://foundryvtt.com/_api/packages/{package_id}/",
    ]
    request_headers = {"User-Agent": "Darksheet release prompt"}
    for url in urls:
        try:
            request = urllib.request.Request(url, headers=request_headers)
            with urllib.request.urlopen(request, timeout=4) as response:
                body = response.read().decode("utf-8", "replace")
        except Exception:
            continue

        version = extract_version_from_payload(body)
        if version:
            return ReleaseInfo(version, f"Foundry public package data: {url}")
    return ReleaseInfo("", "Foundry public package lookup unavailable")


def hidden_subprocess_kwargs() -> dict:
    if os.name != "nt":
        return {}
    startupinfo = subprocess.STARTUPINFO()
    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
    startupinfo.wShowWindow = 0
    return {"startupinfo": startupinfo, "creationflags": subprocess.CREATE_NO_WINDOW}


def run_hidden(command: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        timeout=timeout,
        **hidden_subprocess_kwargs(),
    )


def run_gh_json(arguments: list[str], timeout: int = 30) -> object:
    completed = run_hidden(["gh", *arguments], timeout=timeout)
    return json.loads(completed.stdout or "null")


def previous_github_release_version(current_version: str) -> ReleaseInfo:
    try:
        releases = run_gh_json(
            [
                "release",
                "list",
                "--repo",
                OWNER_REPO,
                "--json",
                "tagName,createdAt",
                "--limit",
                "30",
            ],
            timeout=15,
        )
    except Exception as exc:
        return ReleaseInfo("", f"unknown; GitHub release lookup failed: {exc}")

    if not isinstance(releases, list):
        return ReleaseInfo("", "unknown; GitHub release lookup returned no list")

    current = normalize_version(current_version)
    versions = []
    for release in releases:
        tag = normalize_version(str(release.get("tagName", "")))
        if tag and tag != current:
            versions.append(tag)
    if not versions:
        return ReleaseInfo("", "unknown; no previous GitHub release found")
    return ReleaseInfo(sorted(versions, key=version_sort_key)[-1], "GitHub release fallback")


def resolve_current_package_version(manifest: dict) -> ReleaseInfo:
    foundry = fetch_foundry_package_version(FOUNDRY_PACKAGE_ID)
    if foundry.version:
        return foundry
    return previous_github_release_version(get_field(manifest, "version"))


def parse_github_time(value: str) -> dt.datetime:
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00"))


def list_workflow_runs() -> list[dict]:
    runs = run_gh_json(
        [
            "run",
            "list",
            "--repo",
            OWNER_REPO,
            "--workflow",
            WORKFLOW_FILE,
            "--event",
            "workflow_dispatch",
            "--json",
            "databaseId,status,conclusion,url,createdAt,displayTitle,name",
            "--limit",
            "20",
        ]
    )
    return runs if isinstance(runs, list) else []


def find_dispatched_run(started_at: dt.datetime) -> dict:
    for _ in range(24):
        candidates = []
        for run in list_workflow_runs():
            created_at = parse_github_time(str(run.get("createdAt", "1970-01-01T00:00:00Z")))
            if created_at >= started_at:
                candidates.append(run)
        if candidates:
            candidates.sort(key=lambda run: (parse_github_time(str(run["createdAt"])), int(run["databaseId"])), reverse=True)
            return candidates[0]
        time.sleep(2)
    raise RuntimeError("Timed out waiting for the GitHub workflow run to appear.")


def view_workflow_run(run_id: int) -> dict:
    run = run_gh_json(
        [
            "run",
            "view",
            str(run_id),
            "--repo",
            OWNER_REPO,
            "--json",
            "databaseId,status,conclusion,url,createdAt,updatedAt,displayTitle,name",
        ]
    )
    return run if isinstance(run, dict) else {}


def failed_log_tail(run_id: int) -> str:
    completed = run_hidden(["gh", "run", "view", str(run_id), "--repo", OWNER_REPO, "--log-failed"], timeout=60)
    text = (completed.stdout + "\n" + completed.stderr).strip()
    if not text:
        return ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    useful = [
        line for line in lines
        if "Foundry API request failed" in line
        or "Invalid Release API token" in line
        or "Package Version" in line
        or "HTTP Error" in line
        or '"status": "error"' in line
    ]
    if useful:
        return "\n".join(useful[-8:])
    return "\n".join(lines[-14:])


class FoundryReleasePrompt(tk.Tk):
    def __init__(self, manifest: dict, manifest_path: Path, current_release: ReleaseInfo) -> None:
        super().__init__()
        self.manifest = manifest
        self.manifest_path = manifest_path
        self.current_release = current_release
        self.title("Publish Darksheet Release to Foundry")
        self.minsize(980, 760)
        self.configure(bg="#0f0c14")

        self.fields: dict[str, tk.StringVar] = {}
        self.action_buttons: list[ttk.Button] = []
        self.progress_var = tk.DoubleVar(value=0)
        self.status_var = tk.StringVar(value="Ready.")
        self.run_url_var = tk.StringVar(value="")
        self._build_ui()
        self._raise_window()

    def _raise_window(self) -> None:
        self.update_idletasks()
        width = max(self.winfo_width(), 980)
        height = max(self.winfo_height(), 760)
        x = max((self.winfo_screenwidth() - width) // 2, 0)
        y = max((self.winfo_screenheight() - height) // 2, 0)
        self.geometry(f"{width}x{height}+{x}+{y}")
        self.deiconify()
        self.lift()
        self.focus_force()
        self.attributes("-topmost", True)
        self.after(1500, lambda: self.attributes("-topmost", False))

    def _build_ui(self) -> None:
        root = ttk.Frame(self, padding=18)
        root.grid(row=0, column=0, sticky="nsew")
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)
        root.columnconfigure(1, weight=1)

        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure(".", background="#0f0c14", foreground="#efd8b5", fieldbackground="#ead5b3")
        style.configure("TLabel", background="#0f0c14", foreground="#efd8b5")
        style.configure("Header.TLabel", font=("Segoe UI", 15, "bold"), foreground="#f3ddbd")
        style.configure("Name.TLabel", font=("Segoe UI", 10, "bold"), foreground="#f5ddb6")
        style.configure("Hint.TLabel", font=("Segoe UI", 9), foreground="#cba98b")
        style.configure("Summary.TLabel", foreground="#d7c0a6")
        style.configure("Status.TLabel", foreground="#e5cfb0")
        style.configure("RunUrl.TLabel", foreground="#bfa68f")
        style.configure("TEntry", padding=5, foreground="#141018", fieldbackground="#ead5b3", insertcolor="#141018")
        style.configure("TButton", padding=(12, 7))
        style.configure("Green.Horizontal.TProgressbar", troughcolor="#201821", background="#35c46a", lightcolor="#35c46a", darkcolor="#24984f", bordercolor="#0f0c14")

        version = get_field(self.manifest, "version")
        heading = f"Publish Darksheet v{version} to Foundry?"
        ttk.Label(root, text=heading, style="Header.TLabel").grid(row=0, column=0, columnspan=2, sticky="w")

        summary = self._summary_text()
        ttk.Label(root, text=summary, style="Summary.TLabel", justify="left", wraplength=920).grid(
            row=1, column=0, columnspan=2, sticky="ew", pady=(8, 18)
        )

        rows = [
            ("version", "Version Number:", "The package version number, preferably semantic.", version),
            (
                "manifest",
                "Package Manifest URL:",
                "The release-specific manifest URL for this exact package version.",
                get_field(self.manifest, "manifest"),
            ),
            (
                "download",
                "Package ZIP URL:",
                "The release-specific zip users will install from.",
                get_field(self.manifest, "download"),
            ),
            ("notes", "Release Notes URL:", "A URL describing changes in this package version.", default_notes_url(version)),
            (
                "minimum",
                "Minimum Core Version:",
                "The minimum Foundry core version required to use this package.",
                get_compat(self.manifest, "minimum"),
            ),
            (
                "verified",
                "Verified Core Version:",
                "The most recent Foundry core version verified to work.",
                get_compat(self.manifest, "verified"),
            ),
            (
                "maximum",
                "Maximum Core Version:",
                "The maximum Foundry core version allowed to use this package.",
                get_compat(self.manifest, "maximum", get_compat(self.manifest, "verified")),
            ),
        ]

        for index, (key, label, hint, value) in enumerate(rows):
            row_index = 2 + (index * 2)
            ttk.Label(root, text=label, style="Name.TLabel").grid(row=row_index, column=0, sticky="nw", pady=(0, 2))
            ttk.Label(root, text=hint, style="Hint.TLabel", wraplength=360, justify="left").grid(
                row=row_index + 1, column=0, sticky="nw", pady=(0, 12)
            )
            variable = tk.StringVar(value=value)
            self.fields[key] = variable
            entry = ttk.Entry(root, textvariable=variable)
            entry.grid(row=row_index, column=1, rowspan=2, sticky="new", padx=(18, 0), pady=(0, 18))

        progress_row = 2 + (len(rows) * 2)
        ttk.Progressbar(root, variable=self.progress_var, maximum=100, mode="determinate", style="Green.Horizontal.TProgressbar").grid(
            row=progress_row, column=0, columnspan=2, sticky="ew", pady=(10, 4)
        )
        ttk.Label(root, textvariable=self.status_var, style="Status.TLabel", wraplength=920).grid(
            row=progress_row + 1, column=0, columnspan=2, sticky="ew"
        )
        ttk.Label(root, textvariable=self.run_url_var, style="RunUrl.TLabel", wraplength=920).grid(
            row=progress_row + 2, column=0, columnspan=2, sticky="ew", pady=(2, 8)
        )

        actions = ttk.Frame(root)
        actions.grid(row=progress_row + 3, column=0, columnspan=2, sticky="e", pady=(10, 0))
        dry_run_button = ttk.Button(actions, text="Dry Run", command=lambda: self.dispatch(dry_run=True))
        publish_button = ttk.Button(actions, text="Publish to Foundry", command=lambda: self.dispatch(dry_run=False))
        cancel_button = ttk.Button(actions, text="Cancel", command=self.destroy)
        dry_run_button.grid(row=0, column=0, padx=(0, 8))
        publish_button.grid(row=0, column=1, padx=(0, 8))
        cancel_button.grid(row=0, column=2)
        self.action_buttons = [dry_run_button, publish_button]

    def _summary_text(self) -> str:
        package_id = get_field(self.manifest, "id")
        title = get_field(self.manifest, "title")
        version = get_field(self.manifest, "version")
        minimum = get_compat(self.manifest, "minimum")
        verified = get_compat(self.manifest, "verified")
        return (
            f"Package: {title} (manifest id: {package_id})\n"
            f"Foundry package id: {FOUNDRY_PACKAGE_ID}\n"
            f"Last known published version: {self.current_release.display}\n"
            f"New version: {version}\n"
            f"Compatibility: Foundry {minimum} to verified {verified}\n"
            f"Manifest file: {self.manifest_path}"
        )

    def collect_payload(self, dry_run: bool) -> dict[str, str]:
        payload = {key: variable.get().strip() for key, variable in self.fields.items()}
        payload["dry_run"] = "true" if dry_run else "false"
        return payload

    def set_busy(self, busy: bool) -> None:
        state = "disabled" if busy else "normal"
        for button in self.action_buttons:
            button.configure(state=state)
        self.configure(cursor="watch" if busy else "")

    def set_progress(self, value: float, message: str, run_url: str = "") -> None:
        def update() -> None:
            self.progress_var.set(value)
            self.status_var.set(message)
            self.run_url_var.set(run_url)
        self.after(0, update)

    def finish_workflow(self, success: bool, title: str, message: str, run_url: str = "") -> None:
        def update() -> None:
            self.set_busy(False)
            self.progress_var.set(100 if success else 0)
            self.status_var.set(title)
            self.run_url_var.set(run_url)
            if success:
                messagebox.showinfo(title, message)
            else:
                messagebox.showerror(title, message)
        self.after(0, update)

    def dispatch(self, dry_run: bool) -> None:
        payload = self.collect_payload(dry_run)
        missing = [name for name in ("version", "manifest", "notes", "minimum", "verified") if not payload[name]]
        if missing:
            messagebox.showerror("Missing fields", "Fill in: " + ", ".join(missing))
            return

        if not dry_run:
            confirm = messagebox.askyesno(
                "Publish to Foundry",
                "This will create or update the Foundry package release using the GitHub repository secret.\n\n"
                f"Foundry package id: {FOUNDRY_PACKAGE_ID}\n"
                f"Last known published version: {self.current_release.display}\n"
                f"New version: {payload['version']}\n"
                f"Manifest: {payload['manifest']}\n\n"
                "Continue?",
            )
            if not confirm:
                return

        self.set_busy(True)
        self.progress_var.set(3)
        self.status_var.set("Preparing GitHub workflow dispatch...")
        self.run_url_var.set("")
        thread = threading.Thread(target=self._workflow_worker, args=(payload, dry_run), daemon=True)
        thread.start()

    def _workflow_worker(self, payload: dict[str, str], dry_run: bool) -> None:
        mode = "dry run" if dry_run else "publish"
        command = ["gh", "workflow", "run", WORKFLOW_FILE, "--repo", OWNER_REPO]
        for key, value in payload.items():
            command.extend(["--field", f"{key}={value}"])

        try:
            started_at = dt.datetime.now(dt.timezone.utc) - dt.timedelta(seconds=5)
            self.set_progress(10, f"Dispatching GitHub {mode} workflow...")
            run_hidden(command, timeout=30)

            self.set_progress(25, "Workflow dispatched. Waiting for GitHub to create the run...")
            run = find_dispatched_run(started_at)
            run_id = int(run["databaseId"])
            run_url = str(run.get("url", ""))
            self.set_progress(40, "GitHub run found. Waiting for runner...", run_url)

            while True:
                detail = view_workflow_run(run_id)
                status = str(detail.get("status", "unknown"))
                conclusion = str(detail.get("conclusion") or "")
                run_url = str(detail.get("url") or run_url)

                if status == "completed":
                    if conclusion == "success":
                        self.finish_workflow(
                            True,
                            "Foundry workflow completed",
                            f"The GitHub Actions {mode} workflow completed successfully.\n\n{run_url}",
                            run_url,
                        )
                    else:
                        tail = failed_log_tail(run_id)
                        details = f"The GitHub Actions {mode} workflow failed with conclusion: {conclusion}.\n\n{run_url}"
                        if tail:
                            details = f"{details}\n\nLast failed log lines:\n{tail}"
                        self.finish_workflow(False, "Foundry workflow failed", details, run_url)
                    return

                if status == "queued":
                    self.set_progress(48, "GitHub run is queued...", run_url)
                elif status == "in_progress":
                    self.set_progress(72, "GitHub run is in progress...", run_url)
                else:
                    self.set_progress(55, f"GitHub run status: {status}", run_url)
                time.sleep(3)
        except FileNotFoundError:
            self.finish_workflow(False, "GitHub CLI not found", "Install or log into GitHub CLI, then try again.")
        except subprocess.CalledProcessError as exc:
            output = "\n".join(part for part in (exc.stdout, exc.stderr) if part).strip()
            self.finish_workflow(False, "Workflow dispatch failed", output or str(exc))
        except Exception as exc:
            self.finish_workflow(False, "Workflow tracking failed", str(exc))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Open a Darksheet Foundry release publish popup.")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "module.json",
        help="Path to the release module.json to prefill from.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = args.manifest.resolve()
    manifest = load_manifest(manifest_path)
    current_release = resolve_current_package_version(manifest)
    if sys.stdout:
        print(f"Opening Foundry release prompt for v{get_field(manifest, 'version')} from {manifest_path}", flush=True)
        print(f"Last known published version: {current_release.display}", flush=True)
    app = FoundryReleasePrompt(manifest, manifest_path, current_release)
    app.mainloop()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        log_path = Path(os.environ.get("TEMP", ".")) / "darksheet_foundry_prompt_error.log"
        log_path.write_text(traceback.format_exc(), encoding="utf-8")
        try:
            messagebox.showerror("Darksheet Foundry Prompt Error", f"{exc}\n\nDetails written to:\n{log_path}")
        except Exception:
            pass
        raise