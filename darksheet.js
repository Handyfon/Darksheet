import {
    applications
} from "../../../../systems/dnd5e/dnd5e.mjs"

let activateDDTab = false;

const DARKSCREEN_STORE_DEFAULTS = {
    version: 1,
    lastpage: "party",
    journey: { list: {}, activeId: null },
    disposition: { list: [] },
    dread: { list: {}, activeId: null, displayId: null },
    diseases: { list: [], custom: {}, dismissedReminder: "" },
    itemTempering: {},
    gmScreen: { activePresetId: "default", order: ["default"], presets: { default: { id: "default", name: "Default", slots: [] } } },
    grimoire: {
        url: "https://giffyglyph.com/darkerdungeons/grimoire/4.0.0/en/contents.html",
        bookmarks: []
    },
    resting: { campingDc: "10", lookout: "", campFailures: "\u2014", campActivityDc: "\u2014", campLookoutResult: "\u2014", lifestyle: "comfortable" },
    campfire: { active: false },
    cityRest: { active: false },
    campSetup: { active: false, players: {} }
};
const DARKSHEET_DREAD_MOOD_DEFAULTS = [
    { threshold: 0, text: "You feel relatively safe." },
    { threshold: 5, text: "The air turns uneasy." },
    { threshold: 10, text: "Every shadow feels watchful." },
    { threshold: 20, text: "You are in danger." },
    { threshold: 40, text: "Something terrible is close." },
    { threshold: 80, text: "The dread is overwhelming." },
    { threshold: 160, text: "There is no escaping this place." }
];
const darksheetDreadMoodRuntime = {
    activeKey: null,
    lastKey: null,
    phase: "",
    timers: []
};
const DARKSHEET_SIZE_SLOTS = { tiny: 6, sm: 14, med: 18, lg: 22, huge: 30, grg: 46 };
const DARKSHEET_SLOT_CAPACITY_FORMULAS = {
    flatStr: "flatStr",
    sizeStr: "sizeStr",
    sizeStr2: "sizeStr2"
};

const DARKSHEET_MODULE_ID = "darksheet";
const DARKSHEET_ENCUMBERED_STATUS_ID = "encumbered";
const DARKSHEET_ENCUMBRANCE_STATUS_IDS = [DARKSHEET_ENCUMBERED_STATUS_ID];
const DARKSHEET_ENCUMBRANCE_ABILITIES = ["str", "dex", "con"];
const DARKSHEET_ENCUMBRANCE_MOVEMENT_TYPES = ["burrow", "climb", "fly", "swim", "walk"];
const DARKSHEET_ENCUMBERED_DESCRIPTION = "Speed is halved, and Strength, Dexterity, and Constitution ability checks, attack rolls, and saving throws have disadvantage.";
const darksheetEncumbranceSyncTimers = new Map();
const DARKSHEET_ENCUMBRANCE_STATUS_ICONS = {
    [DARKSHEET_ENCUMBERED_STATUS_ID]: "modules/darksheet/icons/weight.svg"
};

function darksheetEncumbranceStatusConfig(id) {
    const native = CONFIG?.DND5E?.encumbrance?.effects?.[id] ?? {};
    const fallbackName = "Encumbered";
    const icon = DARKSHEET_ENCUMBRANCE_STATUS_ICONS[id] ?? native.img ?? native.icon;
    return {
        id,
        name: native.name ?? fallbackName,
        label: native.name ?? fallbackName,
        icon,
        img: icon,
        statuses: [id],
        changes: darksheetEncumbranceStatusChanges(id),
        description: DARKSHEET_ENCUMBERED_DESCRIPTION,
        hud: true,
        flags: { [DARKSHEET_MODULE_ID]: { encumbranceStatus: id } }
    };
}

function darksheetEncumbranceStatusChanges(_id) {
    return [];
}

function darksheetRegisterEncumbranceStatusEffects() {
    try {
        CONFIG.DND5E ??= {};
        CONFIG.DND5E.statusEffects ??= {};
        CONFIG.statusEffects ??= [];
        darksheetRemoveOtherEncumbranceStatusConfigs();
        const effects = CONFIG.statusEffects;
        for (const id of DARKSHEET_ENCUMBRANCE_STATUS_IDS) {
            const status = darksheetEncumbranceStatusConfig(id);
            CONFIG.DND5E.statusEffects[id] = foundry.utils.mergeObject(
                CONFIG.DND5E.statusEffects[id] ?? {},
                status,
                { inplace: false }
            );
            const existing = Array.isArray(effects)
                ? effects.find(effect => effect?.id === id || effect?._id === id)
                : effects[id] ?? Object.values(effects).find(effect => effect?.id === id || effect?._id === id);
            const target = existing ?? status;
            delete target._id;
            target.id = id;
            target.name = status.name;
            target.label = status.label;
            target.icon = status.icon;
            target.img = status.img;
            target.hud = true;
            target.statuses = status.statuses;
            target.changes = darksheetEncumbranceStatusChanges(id);
            target.description = status.description;
            target.flags ??= {};
            target.flags[DARKSHEET_MODULE_ID] ??= {};
            target.flags[DARKSHEET_MODULE_ID].encumbranceStatus = id;
            if (Array.isArray(effects)) {
                if (!existing) effects.push(target);
                effects[id] = target;
            } else effects[id] = target;
        }
    } catch (error) {
        console.warn("Darksheet | Could not register encumbrance status effects.", error);
    }
}

function darksheetRemoveOtherEncumbranceStatusConfigs() {
    const isOtherDarksheetEncumbrance = effect => {
        const status = effect?.flags?.[DARKSHEET_MODULE_ID]?.encumbranceStatus;
        return status && status !== DARKSHEET_ENCUMBERED_STATUS_ID;
    };
    for (const [id, effect] of Object.entries(CONFIG?.DND5E?.statusEffects ?? {})) {
        if (isOtherDarksheetEncumbrance(effect)) delete CONFIG.DND5E.statusEffects[id];
    }
    if (Array.isArray(CONFIG?.statusEffects)) {
        CONFIG.statusEffects = CONFIG.statusEffects.filter(effect => !isOtherDarksheetEncumbrance(effect));
    } else if (CONFIG?.statusEffects) {
        for (const [id, effect] of Object.entries(CONFIG.statusEffects)) {
            if (isOtherDarksheetEncumbrance(effect)) delete CONFIG.statusEffects[id];
        }
    }
}

function darksheetCanManageEncumbranceEffects() {
    if (!game?.user?.isGM) return false;
    return !game.users?.activeGM || game.users.activeGM === game.user;
}

function darksheetUsesWeightEncumbrance() {
    try {
        return !game.settings.get(DARKSHEET_MODULE_ID, "slotbasedinventory");
    } catch (_error) {
        return false;
    }
}

function darksheetActorSupportsEncumbranceConditions(actor) {
    return actor && ["character", "npc"].includes(actor.type);
}

function darksheetEncumbranceThresholds(actor) {
    const existing = actor?.system?.attributes?.encumbrance?.thresholds ?? {};
    if (Number.isFinite(Number(existing.encumbered))) return existing;
    const config = CONFIG?.DND5E?.encumbrance;
    const unitSystem = game.settings.get("dnd5e", "metricWeightUnits") ? "metric" : "imperial";
    const str = Number(actor?.system?.abilities?.str?.value ?? 10) || 10;
    const sizeKeys = Object.keys(CONFIG?.DND5E?.actorSizes ?? {});
    const size = actor?.system?.traits?.size ?? "med";
    const sizeIndex = Math.max(0, sizeKeys.indexOf(size));
    const sizeConfig = CONFIG?.DND5E?.actorSizes?.[
        sizeKeys[actor?.flags?.dnd5e?.powerfulBuild ? Math.min(sizeIndex + 1, sizeKeys.length - 1) : sizeIndex]
    ];
    const sizeMod = Number(sizeConfig?.capacityMultiplier ?? sizeConfig?.token ?? 1) || 1;
    return {
        encumbered: str * Number(config?.threshold?.encumbered?.[unitSystem] ?? 5) * sizeMod
    };
}

function darksheetItemWeightForEncumbrance(item, units) {
    try {
        const value = item?.system?.totalWeightIn?.(units);
        if (Number.isFinite(Number(value))) return Number(value);
    } catch (_error) { /* fall back below */ }
    const quantity = Number(item?.system?.quantity ?? 1) || 1;
    const weight = item?.system?.weight;
    const value = Number(weight?.value ?? weight ?? 0);
    return Number.isFinite(value) ? value * quantity : 0;
}

function darksheetActorEncumbranceValue(actor) {
    const unitSystem = game.settings.get("dnd5e", "metricWeightUnits") ? "metric" : "imperial";
    const units = (CONFIG?.DND5E?.encumbrance?.baseUnits?.[actor?.type] ?? CONFIG?.DND5E?.encumbrance?.baseUnits?.default)?.[unitSystem] ?? (unitSystem === "metric" ? "kg" : "lb");
    let total = 0;
    for (const item of actor?.items ?? []) {
        if (item?.container) continue;
        total += darksheetItemWeightForEncumbrance(item, units);
    }
    const direct = Math.round(total * 10) / 10;
    if (direct > 0) return direct;
    const prepared = Number(actor?.system?.attributes?.encumbrance?.value);
    return Number.isFinite(prepared) ? prepared : direct;
}

function darksheetActorSlotUsage(actor) {
    let usedSlots = 0;
    const ignoreEquipped = game.settings.get(DARKSHEET_MODULE_ID, "equippedDontUseSlots");
    for (const item of actor?.items ?? []) {
        const slots = Number(item?.flags?.[DARKSHEET_MODULE_ID]?.item?.slots ?? 0);
        const quantity = Number(item?.system?.quantity ?? 1) || 1;
        if (!Number.isFinite(slots)) continue;
        if (ignoreEquipped && item?.system?.equipped) continue;
        usedSlots += slots * quantity;
    }
    const capacity = darksheetActorSlotCapacity(actor);
    return {
        used: Math.round(usedSlots * 10) / 10,
        max: Number(capacity.maxSlots) || 1
    };
}

function darksheetActorSlotEncumbranceTier(actor) {
    const slots = darksheetActorSlotUsage(actor);
    return slots.used > slots.max ? DARKSHEET_ENCUMBERED_STATUS_ID : null;
}

function darksheetActorWeightEncumbranceTier(actor) {
    const value = darksheetActorEncumbranceValue(actor);
    const thresholds = darksheetEncumbranceThresholds(actor);
    const encumbered = Number(thresholds.encumbered);
    if (Number.isFinite(encumbered) && value > encumbered) return DARKSHEET_ENCUMBERED_STATUS_ID;
    return null;
}

function darksheetActorEncumbranceTier(actor) {
    if (!darksheetActorSupportsEncumbranceConditions(actor)) return null;
    return darksheetUsesWeightEncumbrance()
        ? darksheetActorWeightEncumbranceTier(actor)
        : darksheetActorSlotEncumbranceTier(actor);
}

function darksheetEffectHasEncumbranceStatus(effect, id = null) {
    const status = effect?.flags?.[DARKSHEET_MODULE_ID]?.encumbranceStatus;
    if (id) return status === id;
    if (DARKSHEET_ENCUMBRANCE_STATUS_IDS.includes(status)) return true;
    return DARKSHEET_ENCUMBRANCE_STATUS_IDS.some(statusId => {
        if (effect?.statuses?.has?.(statusId)) return true;
        if (Array.isArray(effect?.statuses) && effect.statuses.includes(statusId)) return true;
        const source = effect?._source ?? effect;
        return Array.isArray(source?.statuses) && source.statuses.includes(statusId);
    });
}

function darksheetEffectIsOtherDarksheetEncumbrance(effect) {
    const status = effect?.flags?.[DARKSHEET_MODULE_ID]?.encumbranceStatus;
    return status && status !== DARKSHEET_ENCUMBERED_STATUS_ID;
}

function darksheetActorHasStatus(actor, id) {
    if (!actor || !id) return false;
    if (actor.statuses?.has?.(id)) return true;
    const effects = actor.effects?.contents ?? actor.effects ?? [];
    return Array.from(effects).some(effect => {
        if (effect?.statuses?.has?.(id)) return true;
        if (Array.isArray(effect?.statuses) && effect.statuses.includes(id)) return true;
        const source = effect?._source ?? effect;
        return Array.isArray(source?.statuses) && source.statuses.includes(id);
    });
}

function darksheetEncumbranceEffectData(id) {
    const status = darksheetEncumbranceStatusConfig(id);
    return {
        name: game?.i18n?.localize?.(status.name) ?? status.name,
        img: status.img,
        icon: status.icon,
        statuses: status.statuses,
        changes: status.changes,
        description: status.description,
        disabled: false,
        transfer: false,
        flags: { dnd5e: { isTemporary: true }, [DARKSHEET_MODULE_ID]: { encumbranceStatus: id, automatic: true } }
    };
}

async function darksheetToggleEncumbranceStatus(actor, id, active) {
    if (!actor?.toggleStatusEffect) return false;
    const already = darksheetActorHasStatus(actor, id);
    if (already === active) return true;
    await actor.toggleStatusEffect(id, { active, overlay: false });
    return true;
}

async function darksheetSyncActorEncumbranceConditions(actor, { render = false } = {}) {
    if (!darksheetCanManageEncumbranceEffects() || !darksheetActorSupportsEncumbranceConditions(actor)) return;
    darksheetRegisterEncumbranceStatusEffects();
    const tier = darksheetActorEncumbranceTier(actor);
    for (const id of DARKSHEET_ENCUMBRANCE_STATUS_IDS) {
        await darksheetToggleEncumbranceStatus(actor, id, id === tier);
    }
    const effects = Array.from(actor.effects?.contents ?? actor.effects ?? []);
    const otherEncumbranceEffectIds = effects.filter(effect => darksheetEffectIsOtherDarksheetEncumbrance(effect)).map(effect => effect.id).filter(Boolean);
    if (otherEncumbranceEffectIds.length) await actor.deleteEmbeddedDocuments("ActiveEffect", otherEncumbranceEffectIds, { render, darksheetEncumbranceSync: true });
    const updates = [];
    for (const effect of effects) {
        if (otherEncumbranceEffectIds.includes(effect.id)) continue;
        const status = DARKSHEET_ENCUMBRANCE_STATUS_IDS.find(id => {
            if (effect?.statuses?.has?.(id)) return true;
            if (Array.isArray(effect?.statuses) && effect.statuses.includes(id)) return true;
            const source = effect?._source ?? effect;
            return Array.isArray(source?.statuses) && source.statuses.includes(id);
        });
        if (!status) continue;
        const data = darksheetEncumbranceEffectData(status);
        const patch = { _id: effect.id };
        const effectStatuses = effect?.statuses instanceof Set
            ? Array.from(effect.statuses)
            : Array.isArray(effect?.statuses)
                ? effect.statuses
                : Array.isArray(effect?._source?.statuses)
                    ? effect._source.statuses
                    : [];
        if (effect.flags?.[DARKSHEET_MODULE_ID]?.encumbranceStatus !== status || effect.flags?.[DARKSHEET_MODULE_ID]?.automatic !== true) patch.flags = data.flags;
        if (effect.img !== data.img) patch.img = data.img;
        if (effect.name !== data.name) patch.name = data.name;
        if (effect.description !== data.description) patch.description = data.description;
        if (JSON.stringify(effectStatuses) !== JSON.stringify(data.statuses)) patch.statuses = data.statuses;
        if (JSON.stringify(effect.changes ?? []) !== JSON.stringify(data.changes)) patch.changes = data.changes;
        if (Object.keys(patch).length > 1) updates.push(patch);
    }
    if (updates.length) await actor.updateEmbeddedDocuments("ActiveEffect", updates, { render, darksheetEncumbranceSync: true });
}

function darksheetScheduleEncumbranceSync(actor, { delay = 100 } = {}) {
    if (!darksheetCanManageEncumbranceEffects() || !darksheetActorSupportsEncumbranceConditions(actor)) return;
    const key = actor.uuid ?? actor.id;
    if (!key) return;
    globalThis.clearTimeout(darksheetEncumbranceSyncTimers.get(key));
    darksheetEncumbranceSyncTimers.set(key, globalThis.setTimeout(() => {
        darksheetEncumbranceSyncTimers.delete(key);
        void darksheetSyncActorEncumbranceConditions(actor).catch(error => {
            console.warn("Darksheet | Failed to sync encumbrance conditions.", error);
        });
    }, delay));
}

function darksheetSyncAllEncumbranceConditions() {
    if (!darksheetCanManageEncumbranceEffects()) return;
    for (const actor of game.actors?.contents ?? []) darksheetScheduleEncumbranceSync(actor, { delay: 250 });
}

function darksheetApplyEncumbranceMovementPenalty(actor) {
    if (!darksheetActorSupportsEncumbranceConditions(actor)) return;
    if (!darksheetActorHasStatus(actor, DARKSHEET_ENCUMBERED_STATUS_ID)) return;
    const movement = actor.system?.attributes?.movement;
    if (!movement) return;
    const types = Object.keys(CONFIG?.DND5E?.movementTypes ?? {}).length
        ? Object.keys(CONFIG.DND5E.movementTypes)
        : DARKSHEET_ENCUMBRANCE_MOVEMENT_TYPES;
    for (const type of types) {
        const value = Number(movement[type]);
        if (Number.isFinite(value) && value > 0) movement[type] = value / 2;
    }
    if (Number.isFinite(Number(movement.walk))) movement.speed = movement.walk;
    movement.max = Math.max(0, ...types.map(type => Number(movement[type]) || 0));
    movement.slowed = true;
}

function darksheetPatchEncumbrancePreparation() {
    const ActorClass = CONFIG?.Actor?.documentClass;
    if (!ActorClass?.prototype || ActorClass.prototype._darksheetEncumbrancePreparationPatched) return;
    const original = ActorClass.prototype.prepareDerivedData;
    if (typeof original !== "function") return;
    ActorClass.prototype.prepareDerivedData = function(...args) {
        const result = original.apply(this, args);
        darksheetApplyEncumbranceMovementPenalty(this);
        return result;
    };
    ActorClass.prototype._darksheetEncumbrancePreparationPatched = true;
}

function darksheetRollActor(process) {
    const subject = process?.subject;
    return subject?.actor ?? subject?.item?.actor ?? subject;
}

function darksheetRollAbility(process, config) {
    const subject = process?.subject;
    return process?.ability ?? config?.ability ?? subject?.ability ?? subject?.item?.system?.ability;
}

function darksheetApplyEncumbranceRollDisadvantage(process, config) {
    const actor = darksheetRollActor(process);
    if (!darksheetActorSupportsEncumbranceConditions(actor)) return;
    if (!darksheetActorHasStatus(actor, DARKSHEET_ENCUMBERED_STATUS_ID)) return;
    const ability = darksheetRollAbility(process, config);
    if (!DARKSHEET_ENCUMBRANCE_ABILITIES.includes(ability)) return;
    config.disadvantage = true;
    config.options ??= {};
    config.options.disadvantage = true;
    for (const roll of config.rolls ?? []) {
        roll.options ??= {};
        roll.options.disadvantage = true;
    }
}

function darksheetSlotCapacityFormula() {
    try {
        const formula = game.settings.get('darksheet', 'slotCapacityFormula');
        return Object.values(DARKSHEET_SLOT_CAPACITY_FORMULAS).includes(formula)
            ? formula
            : DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr;
    } catch (_error) {
        return DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr;
    }
}

function darksheetActorSlotCapacity(actor) {
    const formula = darksheetSlotCapacityFormula();
    const sizeKey = actor?.system?.traits?.size ?? "med";
    const sizeSlots = Number(DARKSHEET_SIZE_SLOTS[sizeKey] ?? DARKSHEET_SIZE_SLOTS.med);
    const strScore = Number(actor?.system?.abilities?.str?.value ?? 0);
    const strengthSlots = Number.isFinite(strScore) ? Math.max(0, strScore) : 0;
    let baseSlots = sizeSlots;
    let strengthMultiplier = 1;

    if (formula === DARKSHEET_SLOT_CAPACITY_FORMULAS.flatStr) {
        baseSlots = 0;
    } else if (formula === DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr2) {
        strengthMultiplier = 2;
    }

    return {
        formula,
        sizeSlots: baseSlots,
        strengthSlots,
        strengthMultiplier,
        maxSlots: Math.max(1, baseSlots + strengthSlots * strengthMultiplier)
    };
}

function darksheetCloneData(data) {
    if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(data);
    return JSON.parse(JSON.stringify(data));
}

async function darksheetRenderTemplate(path, data) {
    const renderer = globalThis.foundry?.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
    if (typeof renderer !== "function") throw new Error("Darksheet | Foundry template renderer is unavailable.");
    return renderer(path, data);
}

function darksheetRefreshCharacterSheets() {
    Object.values(globalThis.ui?.windows ?? {}).forEach(app => {
        if (app?.actor?.type === "character") app.render(false);
    });
}

function darksheetDreadInfluenceTier(max) {
    const m = Number(max || 0);
    if (m <= 1) return { label: "Trivial", max: 1 };
    if (m <= 5) return { label: "Fleeting", max: 5 };
    if (m <= 10) return { label: "Noticeable", max: 10 };
    if (m <= 20) return { label: "Unmistakable", max: 20 };
    if (m <= 40) return { label: "Powerful", max: 40 };
    if (m <= 80) return { label: "Indomitable", max: 80 };
    return { label: "Absolute", max: Number(max || 1000) };
}

function darksheetIndefiniteArticle(text = "") {
    return /^[aeiou]/i.test(String(text).trim()) ? "an" : "a";
}

function darksheetDreadBannerZone() {
    const store = getDarkscreenStore()?.dread ?? {};
    const displayId = store.displayId;
    return displayId && store.list?.[displayId] ? store.list[displayId] : null;
}

function darksheetDreadBannerText(zone) {
    const tier = darksheetDreadInfluenceTier(zone?.max ?? 20);
    return `You can feel ${darksheetIndefiniteArticle(tier.label)} ${tier.label} Influence`;
}

function darksheetNormalizeDreadMoodThresholds(raw = DARKSHEET_DREAD_MOOD_DEFAULTS) {
    const source = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object"
            ? Object.values(raw)
            : DARKSHEET_DREAD_MOOD_DEFAULTS;
    const rows = [];
    for (const entry of source ?? []) {
        const threshold = Math.max(0, Number(entry?.threshold ?? entry?.value ?? entry?.min ?? 0));
        const text = String(entry?.text ?? entry?.label ?? entry?.message ?? "").trim();
        if (!Number.isFinite(threshold) || !text) continue;
        rows.push({ threshold, text });
    }
    const fallback = darksheetCloneData(DARKSHEET_DREAD_MOOD_DEFAULTS);
    const normalized = rows.length ? rows : fallback;
    return normalized.sort((a, b) => Number(a.threshold) - Number(b.threshold));
}

function darksheetDreadMoodThresholds() {
    try {
        return darksheetNormalizeDreadMoodThresholds(game.settings.get('darksheet', 'dreadMoodThresholds'));
    } catch (_error) {
        return darksheetNormalizeDreadMoodThresholds(DARKSHEET_DREAD_MOOD_DEFAULTS);
    }
}

function darksheetDreadMoodForZone(zone) {
    const max = Math.max(1, Number(zone?.max ?? 20));
    const current = Math.max(0, Math.min(max, Number(zone?.current ?? 0)));
    const rows = darksheetDreadMoodThresholds();
    let active = rows[0] ?? DARKSHEET_DREAD_MOOD_DEFAULTS[0];
    for (const row of rows) {
        if (current + 0.0001 >= Number(row.threshold ?? 0)) active = row;
        else break;
    }
    return {
        ...active,
        current,
        key: `${Number(active.threshold ?? 0)}:${active.text}`
    };
}

function darksheetDreadMoodClass(mood) {
    const threshold = Number(mood?.threshold ?? 0);
    if (threshold >= 90) return "is-critical";
    if (threshold >= 75) return "is-dire";
    if (threshold >= 50) return "is-danger";
    if (threshold >= 25) return "is-uneasy";
    return "is-safe";
}

function darksheetDreadMoodKey(zone, mood) {
    return `${zone?.id ?? zone?.name ?? "zone"}:${Number(mood?.threshold ?? 0)}:${mood?.text ?? ""}`;
}

function darksheetClearDreadMoodTimers({ clearLast = false } = {}) {
    for (const timer of darksheetDreadMoodRuntime.timers) globalThis.clearTimeout(timer);
    darksheetDreadMoodRuntime.timers = [];
    darksheetDreadMoodRuntime.activeKey = null;
    darksheetDreadMoodRuntime.phase = "";
    if (clearLast) darksheetDreadMoodRuntime.lastKey = null;
}

function darksheetSetDreadMoodPhase(moodEl, phase = "") {
    darksheetDreadMoodRuntime.phase = phase;
    moodEl?.classList?.remove("is-typing", "is-holding", "is-fading");
    if (phase) moodEl?.classList?.add(phase);
}

function darksheetDreadMoodDelayForChar(char = "") {
    const base = 24 + Math.random() * 74;
    if (/[.,;:!?]/.test(char)) return base + 130 + Math.random() * 140;
    if (/\s/.test(char)) return base * 0.55;
    return base;
}

function darksheetStartDreadMoodTyping(moodEl, mood, moodKey) {
    if (!moodEl || !mood?.text) return;
    darksheetClearDreadMoodTimers();
    darksheetDreadMoodRuntime.activeKey = moodKey;
    darksheetDreadMoodRuntime.lastKey = moodKey;
    moodEl.hidden = false;
    moodEl.textContent = "";
    darksheetSetDreadMoodPhase(moodEl, "is-typing");

    const chars = Array.from(String(mood.text));
    let index = 0;
    const schedule = (fn, delay) => {
        const timer = globalThis.setTimeout(() => {
            darksheetDreadMoodRuntime.timers = darksheetDreadMoodRuntime.timers.filter(id => id !== timer);
            fn();
        }, delay);
        darksheetDreadMoodRuntime.timers.push(timer);
    };
    const typeNext = () => {
        if (darksheetDreadMoodRuntime.activeKey !== moodKey || !document.body.contains(moodEl)) return;
        if (index >= chars.length) {
            darksheetSetDreadMoodPhase(moodEl, "is-holding");
            schedule(() => {
                if (darksheetDreadMoodRuntime.activeKey !== moodKey || !document.body.contains(moodEl)) return;
                darksheetSetDreadMoodPhase(moodEl, "is-fading");
                schedule(() => {
                    if (darksheetDreadMoodRuntime.activeKey !== moodKey || !document.body.contains(moodEl)) return;
                    moodEl.hidden = true;
                    moodEl.textContent = "";
                    darksheetClearDreadMoodTimers();
                    darksheetDreadMoodRuntime.lastKey = moodKey;
                }, 1200);
            }, 1800);
            return;
        }
        moodEl.textContent += chars[index];
        index += 1;
        schedule(typeNext, darksheetDreadMoodDelayForChar(chars[index - 1]));
    };
    schedule(typeNext, 120 + Math.random() * 220);
}

function darksheetFormatDreadAmount(value) {
    const number = Number(value ?? 0);
    if (!Number.isFinite(number)) return "0";
    if (Number.isInteger(number)) return String(number);
    return number.toFixed(2).replace(/\.?0+$/, "");
}

function darksheetDreadBannerHeading(zone) {
    if (!game.user?.isGM) return `<div class="darksheet-dread-zone-banner__label">Dread Zone</div>`;
    const max = Math.max(1, Number(zone?.max ?? 20));
    const current = Math.max(0, Math.min(max, Number(zone?.current ?? 0)));
    return `
        <div class="darksheet-dread-zone-banner__heading">
            <button type="button" class="darksheet-dread-zone-banner__adjust" data-darksheet-dread-banner-change="-1" title="Reduce displayed dread" aria-label="Reduce displayed dread">
                <i class="fas fa-minus" inert></i>
            </button>
            <div class="darksheet-dread-zone-banner__title">
                <div class="darksheet-dread-zone-banner__label">Dread Zone</div>
                <div class="darksheet-dread-zone-banner__meter">${darksheetFormatDreadAmount(current)} / ${darksheetFormatDreadAmount(max)} dread</div>
            </div>
            <button type="button" class="darksheet-dread-zone-banner__adjust" data-darksheet-dread-banner-change="1" title="Add displayed dread" aria-label="Add displayed dread">
                <i class="fas fa-plus" inert></i>
            </button>
        </div>
    `;
}

async function darksheetChangeDisplayedDread(amount) {
    if (!game.user?.isGM) return;
    const screenData = getDarkscreenStore();
    const dread = screenData.dread ?? {};
    const displayId = dread.displayId;
    const zone = displayId ? dread.list?.[displayId] : null;
    if (!zone) {
        ui.notifications.warn("Darksheet | No player-facing dread zone is active.");
        return;
    }
    const max = Math.max(1, Number(zone.max ?? 20));
    const current = Math.max(0, Math.min(max, Number(zone.current ?? 0)));
    const next = Math.max(0, Math.min(max, current + Number(amount || 0)));
    dread.list[displayId] = { ...zone, current: next, max };
    await writeDarkscreenStore({ ...screenData, dread });
    if (globalThis.Darksheet?._darkscreen?.rendered) await globalThis.Darksheet.darkScreenReload?.();
    darksheetUpdateDreadZoneBanner();
}

function darksheetHandleDreadBannerClick(event) {
    const button = event.target?.closest?.("[data-darksheet-dread-banner-change]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    darksheetChangeDisplayedDread(Number(button.dataset.darksheetDreadBannerChange)).catch(error => {
        console.error("Darksheet | Failed to adjust displayed dread.", error);
        ui.notifications.error("Darksheet | Failed to adjust displayed dread.");
    });
}

function darksheetUpdateDreadZoneBanner() {
    if (!globalThis.document?.body) return;
    const id = "darksheet-dread-zone-banner";
    const zone = darksheetDreadBannerZone();
    let banner = document.getElementById(id);
    if (!zone) {
        darksheetClearDreadMoodTimers({ clearLast: true });
        banner?.remove();
        return;
    }
    if (!banner) {
        banner = document.createElement("div");
        banner.id = id;
        banner.className = "darksheet-dread-zone-banner";
        banner.addEventListener("click", darksheetHandleDreadBannerClick);
        banner.innerHTML = `
            <div data-darksheet-dread-banner-heading></div>
            <div class="darksheet-dread-zone-banner__text"></div>
            <div class="darksheet-dread-zone-banner__mood" hidden></div>
        `;
        document.body.append(banner);
    }
    const mood = darksheetDreadMoodForZone(zone);
    const moodKey = darksheetDreadMoodKey(zone, mood);
    const headingEl = banner.querySelector("[data-darksheet-dread-banner-heading]");
    const textEl = banner.querySelector(".darksheet-dread-zone-banner__text");
    const moodEl = banner.querySelector(".darksheet-dread-zone-banner__mood");
    if (headingEl) headingEl.innerHTML = darksheetDreadBannerHeading(zone);
    if (textEl) textEl.textContent = darksheetDreadBannerText(zone);
    if (!moodEl) return;

    const currentPhase = darksheetDreadMoodRuntime.activeKey === moodKey ? darksheetDreadMoodRuntime.phase : "";
    moodEl.className = `darksheet-dread-zone-banner__mood ${darksheetDreadMoodClass(mood)}`;
    if (currentPhase) moodEl.classList.add(currentPhase);
    moodEl.dataset.darksheetDreadMoodKey = moodKey;

    if (darksheetDreadMoodRuntime.activeKey === moodKey) return;
    if (darksheetDreadMoodRuntime.lastKey !== moodKey) {
        darksheetStartDreadMoodTyping(moodEl, mood, moodKey);
        return;
    }
    moodEl.hidden = true;
    moodEl.textContent = "";
}

function darksheetNormalizeItemBulkTable(raw, fallback = itemBulk) {
    const hasExplicitSource = raw && typeof raw === "object";
    const source = hasExplicitSource ? raw : fallback;
    const table = {};
    for (const [name, value] of Object.entries(source ?? {})) {
        const key = String(name ?? "").trim();
        const slots = Number(value);
        if (key && Number.isFinite(slots)) table[key] = slots;
    }
    if (Object.keys(table).length) return table;
    return hasExplicitSource ? {} : darksheetCloneData(fallback);
}

function darksheetNormalizeFragileItems(raw, fallback = fragileItems) {
    const hasExplicitSource = raw != null;
    const source = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object"
            ? Object.values(raw)
            : fallback;
    const seen = new Set();
    const list = [];
    for (const value of source ?? []) {
        const itemName = String(value ?? "").trim();
        const key = itemName.toLocaleLowerCase();
        if (!itemName || seen.has(key)) continue;
        seen.add(key);
        list.push(itemName);
    }
    if (list.length) return list;
    return hasExplicitSource ? [] : darksheetCloneData(fallback);
}

function darksheetItemBulkTable() {
    try {
        return darksheetNormalizeItemBulkTable(game.settings.get('darksheet', 'itemAutomationSlotTable'));
    } catch (_error) {
        return darksheetNormalizeItemBulkTable(itemBulk);
    }
}

function darksheetFragileItemsTable() {
    try {
        return darksheetNormalizeFragileItems(game.settings.get('darksheet', 'itemAutomationFragileTable'));
    } catch (_error) {
        return darksheetNormalizeFragileItems(fragileItems);
    }
}

function darksheetSlotTableToText(table = itemBulk) {
    return Object.entries(darksheetNormalizeItemBulkTable(table))
        .map(([name, slots]) => `${name} = ${slots}`)
        .join("\n");
}

function darksheetSlotTableToRows(table = itemBulk) {
    return Object.entries(darksheetNormalizeItemBulkTable(table))
        .map(([name, slots]) => ({ name, slots }));
}

function darksheetFragileItemsToText(items = fragileItems) {
    return darksheetNormalizeFragileItems(items).join("\n");
}

function darksheetFragileItemsToTags(items = fragileItems) {
    return darksheetNormalizeFragileItems(items).map(name => ({ name }));
}

function darksheetParseSlotTableText(text) {
    const table = {};
    const errors = [];
    String(text ?? "").split(/\r?\n/).forEach((rawLine, index) => {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith("//")) return;
        const separator = line.includes("=") ? "=" : line.includes("\t") ? "\t" : line.includes("|") ? "|" : "";
        if (!separator) {
            errors.push(`Line ${index + 1}: use "Item Name = Slots".`);
            return;
        }
        const parts = line.split(separator);
        const value = parts.pop();
        const name = parts.join(separator).trim();
        const slots = Number(String(value ?? "").trim());
        if (!name) errors.push(`Line ${index + 1}: missing item name.`);
        else if (!Number.isFinite(slots)) errors.push(`Line ${index + 1}: slots must be a number.`);
        else table[name] = slots;
    });
    if (errors.length) throw new Error(errors.join("\n"));
    return table;
}

function darksheetParseFragileItemsText(text) {
    return darksheetNormalizeFragileItems(String(text ?? "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith("#") && !line.startsWith("//")));
}

function darksheetExtractRoll(result) {
    if (!result) return null;
    if (Array.isArray(result)) {
        for (const entry of result) {
            const roll = darksheetExtractRoll(entry);
            if (roll) return roll;
        }
        return null;
    }
    if (globalThis.Roll && result instanceof Roll) return result;
    if (Array.isArray(result.rolls) && result.rolls.length) return darksheetExtractRoll(result.rolls);
    if (result.roll) return darksheetExtractRoll(result.roll);
    if (result.message) return darksheetExtractRoll(result.message);
    if (result.total != null || result._total != null) return result;
    return null;
}

function darksheetRollTotal(roll) {
    const total = Number(roll?.total ?? roll?._total);
    return Number.isFinite(total) ? total : 0;
}

function darksheetRollMessageIds(result, ids = new Set(), seen = new WeakSet()) {
    if (!result) return ids;
    if (Array.isArray(result)) {
        result.forEach(entry => darksheetRollMessageIds(entry, ids, seen));
        return ids;
    }
    if (typeof result !== "object") return ids;
    if (seen.has(result)) return ids;
    seen.add(result);
    for (const key of ["id", "_id"]) {
        const value = result[key];
        if (typeof value === "string" && (result.documentName === "ChatMessage" || result.constructor?.name === "ChatMessage")) ids.add(value);
    }
    const optionId = result.options?.messageId ?? result.options?.chatMessageId;
    if (typeof optionId === "string") ids.add(optionId);
    if (result.message) darksheetRollMessageIds(result.message, ids, seen);
    if (result.chatMessage) darksheetRollMessageIds(result.chatMessage, ids, seen);
    if (Array.isArray(result.rolls)) darksheetRollMessageIds(result.rolls, ids, seen);
    return ids;
}

function darksheetAnimatedDiceAvailable() {
    const dice3d = game?.dice3d;
    if (!dice3d) return false;
    try {
        if (typeof dice3d.isEnabled === "function") return !!dice3d.isEnabled();
    } catch (_error) {}
    return true;
}

function darksheetBeginRollSettleWait({ grace = 500, timeout = 8000 } = {}) {
    if (!darksheetAnimatedDiceAvailable()) return { wait: async () => {}, cancel: () => {} };

    let done = false;
    let waitingForIds = null;
    let resolve;
    let timeoutId = null;
    const completion = new Promise(r => { resolve = r; });
    const processed = [];
    const completed = new Set();

    const finish = () => {
        if (done) return;
        done = true;
        try { Hooks.off("diceSoNiceMessageProcessed", onProcessed); } catch (_error) {}
        try { Hooks.off("diceSoNiceRollComplete", onComplete); } catch (_error) {}
        if (timeoutId) globalThis.clearTimeout(timeoutId);
        resolve?.();
    };
    const onProcessed = (messageId, data = {}) => {
        processed.push({ id: messageId == null ? "" : String(messageId), willAnimate: !!data.willTrigger3DRoll });
    };
    const onComplete = (messageId) => {
        const id = messageId == null ? "" : String(messageId);
        completed.add(id);
        if (waitingForIds === null) return;
        if (!waitingForIds || !waitingForIds.size || !id || waitingForIds.has(id)) finish();
    };

    try {
        Hooks.on("diceSoNiceMessageProcessed", onProcessed);
        Hooks.on("diceSoNiceRollComplete", onComplete);
    } catch (_error) {
        finish();
    }

    return {
        wait: async (result = null) => {
            if (done) return;
            const messageIds = darksheetRollMessageIds(result);
            await new Promise(resolveGrace => globalThis.setTimeout(resolveGrace, grace));
            if (done) return;
            const relevant = messageIds.size
                ? processed.find(entry => messageIds.has(entry.id))
                : processed[processed.length - 1];
            if (!relevant?.willAnimate) {
                finish();
                return;
            }
            waitingForIds = messageIds;
            if (!messageIds.size || completed.has("") || Array.from(messageIds).some(id => completed.has(id))) {
                finish();
                return;
            }
            timeoutId = globalThis.setTimeout(finish, timeout);
            await completion;
        },
        cancel: finish
    };
}

async function darksheetShowRollAndWait(roll) {
    const waiter = darksheetBeginRollSettleWait();
    try {
        if (game?.dice3d?.showForRoll) await game.dice3d.showForRoll(roll, game.user, true);
        await waiter.wait(roll);
    } catch (error) {
        waiter.cancel();
        throw error;
    }
    return roll;
}

const DarksheetFormApplication = globalThis.foundry?.appv1?.api?.FormApplication ?? globalThis.FormApplication;

class DarksheetItemAutomationTablesConfig extends DarksheetFormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "darksheet-item-automation-tables",
            title: "Darksheet Automatic Item Tables",
            template: "modules/darksheet/templates/item-automation-tables.html",
            width: 720,
            height: "auto",
            resizable: true,
            closeOnSubmit: false
        });
    }

    getData(options = {}) {
        return {
            ...super.getData(options),
            slotTable: darksheetSlotTableToText(darksheetItemBulkTable()),
            slotRows: darksheetSlotTableToRows(darksheetItemBulkTable()),
            fragileTable: darksheetFragileItemsToText(darksheetFragileItemsTable()),
            fragileTags: darksheetFragileItemsToTags(darksheetFragileItemsTable())
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        const root = html?.[0] ?? html;
        html.find("[data-action='add-slot-row']").on("click", event => {
            event.preventDefault();
            const body = root?.querySelector?.("[data-slot-table-body]");
            if (!body) return;
            const search = root?.querySelector?.("[data-slot-search]");
            if (search) search.value = "";
            body.insertAdjacentHTML("afterbegin", this._slotRowHtml());
            body.querySelector("[data-slot-row] input[name='slotName']")?.focus();
            this._filterSlotRows(root);
        });
        html.find("[data-slot-search]").on("input", () => this._filterSlotRows(root));
        html.find("[data-slot-table-body]").on("input", "input", () => this._filterSlotRows(root));
        html.find("[data-slot-table-body]").on("click", "[data-action='remove-slot-row']", event => {
            event.preventDefault();
            event.currentTarget.closest("[data-slot-row]")?.remove();
        });
        html.find("[data-action='add-fragile-tag']").on("click", event => {
            event.preventDefault();
            this._addFragileTag(root);
        });
        html.find("[data-fragile-new]").on("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            this._addFragileTag(root);
        });
        html.find("[data-fragile-tags]").on("click", "[data-action='remove-fragile-tag']", event => {
            event.preventDefault();
            event.currentTarget.closest("[data-fragile-tag]")?.remove();
        });
        html.find("[data-action='reset-defaults']").on("click", async event => {
            event.preventDefault();
            const confirmed = await Dialog.confirm({
                title: "Reset Automatic Item Tables",
                content: "<p>Reset automatic slot and fragile item tables to Darksheet defaults?</p>"
            });
            if (!confirmed) return;
            await game.settings.set('darksheet', 'itemAutomationSlotTable', darksheetCloneData(itemBulk));
            await game.settings.set('darksheet', 'itemAutomationFragileTable', darksheetCloneData(fragileItems));
            ui.notifications?.info("Darksheet | Automatic item tables reset.");
            darksheetRefreshCharacterSheets();
            this.render(false);
        });
    }

    _slotRowHtml({ name = "", slots = "" } = {}) {
        return `
            <tr data-slot-row>
                <td><input type="text" name="slotName" value="${escapeSheetHtml(name)}" placeholder="Item name match"></td>
                <td><input type="number" name="slotSlots" value="${escapeSheetHtml(slots)}" step="any" placeholder="0"></td>
                <td class="ds-slot-table__remove"><button type="button" data-action="remove-slot-row"><i class="fas fa-trash"></i> Remove</button></td>
            </tr>
        `;
    }

    _filterSlotRows(root) {
        const query = String(root?.querySelector?.("[data-slot-search]")?.value ?? "").trim().toLocaleLowerCase();
        root?.querySelectorAll?.("[data-slot-row]").forEach(row => {
            const name = String(row.querySelector("[name='slotName']")?.value ?? "").toLocaleLowerCase();
            const slots = String(row.querySelector("[name='slotSlots']")?.value ?? "").toLocaleLowerCase();
            row.hidden = !!query && !name.includes(query) && !slots.includes(query);
        });
    }

    _fragileTagHtml(name) {
        return `
            <span class="ds-fragile-tag" data-fragile-tag>
                <input type="hidden" name="fragileTag" value="${escapeSheetHtml(name)}">
                <span>${escapeSheetHtml(name)}</span>
                <button type="button" data-action="remove-fragile-tag" title="Remove ${escapeSheetHtml(name)}"><i class="fas fa-xmark"></i></button>
            </span>
        `;
    }

    _addFragileTag(root) {
        const input = root?.querySelector?.("[data-fragile-new]");
        const container = root?.querySelector?.("[data-fragile-tags]");
        const name = String(input?.value ?? "").trim();
        if (!name || !container) return;
        const exists = Array.from(container.querySelectorAll("input[name='fragileTag']"))
            .some(tag => String(tag.value ?? "").trim().toLocaleLowerCase() === name.toLocaleLowerCase());
        if (exists) {
            ui.notifications?.warn(`Darksheet | ${name} is already in the fragile list.`);
            return;
        }
        container.insertAdjacentHTML("beforeend", this._fragileTagHtml(name));
        input.value = "";
        input.focus();
    }

    _slotTableFromForm(form) {
        const table = {};
        const errors = [];
        Array.from(form?.querySelectorAll?.("[data-slot-row]") ?? []).forEach((row, index) => {
            const name = String(row.querySelector("[name='slotName']")?.value ?? "").trim();
            const rawSlots = String(row.querySelector("[name='slotSlots']")?.value ?? "").trim();
            if (!name && !rawSlots) return;
            const slots = Number(rawSlots);
            if (!name) errors.push(`Slot row ${index + 1}: missing item name.`);
            else if (!Number.isFinite(slots)) errors.push(`Slot row ${index + 1}: slots must be a number.`);
            else table[name] = slots;
        });
        if (errors.length) throw new Error(errors.join("\n"));
        return table;
    }

    _fragileTagsFromForm(form) {
        const tags = Array.from(form?.querySelectorAll?.("input[name='fragileTag']") ?? [])
            .map(input => String(input.value ?? "").trim())
            .filter(Boolean);
        return darksheetNormalizeFragileItems(tags, []);
    }

    async _updateObject(_event, formData) {
        try {
            const field = key => formData?.get?.(key) ?? formData?.[key] ?? "";
            const form = _event?.currentTarget ?? this.form;
            const slotTable = form ? this._slotTableFromForm(form) : darksheetParseSlotTableText(field("slotTable"));
            const fragileTable = form ? this._fragileTagsFromForm(form) : darksheetParseFragileItemsText(field("fragileTable"));
            await game.settings.set('darksheet', 'itemAutomationSlotTable', slotTable);
            await game.settings.set('darksheet', 'itemAutomationFragileTable', fragileTable);
            ui.notifications?.info("Darksheet | Automatic item tables saved.");
            darksheetRefreshCharacterSheets();
            this.close();
        } catch (error) {
            console.error("Darksheet | Could not save automatic item tables.", error);
            ui.notifications?.error(`Darksheet | ${error.message}`);
        }
    }
}

class DarksheetDreadMoodTextConfig extends DarksheetFormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "darksheet-dread-mood-texts",
            title: "Darksheet Dread Mood Texts",
            template: "modules/darksheet/templates/dread-mood-texts.html",
            width: 680,
            height: "auto",
            resizable: true,
            closeOnSubmit: false
        });
    }

    getData(options = {}) {
        return {
            ...super.getData(options),
            rows: darksheetDreadMoodThresholds()
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        const root = html?.[0] ?? html;
        html.find("[data-action='add-dread-mood-row']").on("click", event => {
            event.preventDefault();
            const body = root?.querySelector?.("[data-dread-mood-body]");
            if (!body) return;
            body.insertAdjacentHTML("afterbegin", this._rowHtml({ threshold: 0, text: "" }));
            body.querySelector("[data-dread-mood-row] input[name='moodText']")?.focus();
        });
        html.find("[data-dread-mood-body]").on("click", "[data-action='remove-dread-mood-row']", event => {
            event.preventDefault();
            event.currentTarget.closest("[data-dread-mood-row]")?.remove();
        });
        html.find("[data-action='reset-defaults']").on("click", async event => {
            event.preventDefault();
            const confirmed = await Dialog.confirm({
                title: "Reset Dread Mood Texts",
                content: "<p>Reset Dread mood threshold text to Darksheet defaults?</p>"
            });
            if (!confirmed) return;
            await game.settings.set('darksheet', 'dreadMoodThresholds', darksheetCloneData(DARKSHEET_DREAD_MOOD_DEFAULTS));
            globalThis.Darksheet?.updateDreadZoneBanner?.();
            ui.notifications?.info("Darksheet | Dread mood texts reset.");
            this.render(false);
        });
    }

    _rowHtml({ threshold = 0, text = "" } = {}) {
        return `
            <tr data-dread-mood-row>
                <td><input type="number" name="moodThreshold" value="${escapeSheetHtml(threshold)}" min="0" step="1"></td>
                <td><input type="text" name="moodText" value="${escapeSheetHtml(text)}" placeholder="You feel watched."></td>
                <td class="ds-slot-table__remove"><button type="button" data-action="remove-dread-mood-row"><i class="fas fa-trash"></i> Remove</button></td>
            </tr>
        `;
    }

    _rowsFromForm(form) {
        const rows = [];
        const errors = [];
        Array.from(form?.querySelectorAll?.("[data-dread-mood-row]") ?? []).forEach((row, index) => {
            const rawThreshold = String(row.querySelector("[name='moodThreshold']")?.value ?? "").trim();
            const text = String(row.querySelector("[name='moodText']")?.value ?? "").trim();
            if (!rawThreshold && !text) return;
            const threshold = Number(rawThreshold);
            if (!Number.isFinite(threshold)) errors.push(`Mood row ${index + 1}: threshold must be a number.`);
            else if (threshold < 0) errors.push(`Mood row ${index + 1}: threshold must be 0 or higher.`);
            else if (!text) errors.push(`Mood row ${index + 1}: missing mood text.`);
            else rows.push({ threshold, text });
        });
        if (errors.length) throw new Error(errors.join("\n"));
        return darksheetNormalizeDreadMoodThresholds(rows);
    }

    async _updateObject(event, _formData) {
        try {
            const rows = this._rowsFromForm(event?.currentTarget ?? this.form);
            await game.settings.set('darksheet', 'dreadMoodThresholds', rows);
            globalThis.Darksheet?.updateDreadZoneBanner?.();
            ui.notifications?.info("Darksheet | Dread mood texts saved.");
            this.close();
        } catch (error) {
            console.error("Darksheet | Could not save dread mood texts.", error);
            ui.notifications?.error(`Darksheet | ${error.message}`);
        }
    }
}

//Register Sheet
Hooks.once('init', function() {
    //console.log("Darker DnD | Initializing Darker Dungeons for the D&D 5th Edition System\n", "_____________________________________________________________________________________________\n", " ____ _ ____ \n", " | _ \\ __ _ _ __ | | __ ___ _ __ | _ \\ _ _ _ __ __ _ ___ ___ _ __ ___ \n", " | | | | / _` || '__|| |/ // _ \| '__| | | | || | | || '_ \\ / _` | / _ \\ / _ \\ | '_ \\ / __| \n", " | |_| || (_| || | | <| __/| | | |_| || |_| || | | || (_| || __/| (_) || | | |\\__ \\ \n", " |____/ \\__,_||_| |_|\\_\\\\___||_| |____/ \\__,_||_| |_| \\__, | \\___| \\___/ |_| |_||___/ \n", " |___/ \n", "_____________________________________________________________________________________________");
    /*Actors.registerSheet('dnd5e', darksheet, {
 types: ['character']
 });*/
    game.settings.register('darksheet', 'slotbasedinventory', {
        name: 'Inventory Slot System',
        hint: 'When enabled, the inventory will use a slot-based system instead of a weight-based system.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'requireRecipes', {
        name: 'Require Crafting Recipes',
        hint: 'When enabled, a character must own the matching recipe item to craft a jewel or oil in the Crafting tab (GM quick mode bypasses this).',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'publicRecipes', {
        name: 'Public Crafting Recipes',
        hint: 'GM-managed Darksheet recipes available to all players.',
        scope: 'world',
        config: false,
        default: [],
        type: Object,
    });
    game.settings.register('darksheet', 'sharedRecipes', {
        name: 'Shared Crafting Recipes',
        hint: 'Player-shared Darksheet recipe references available to all players.',
        scope: 'world',
        config: false,
        default: [],
        type: Object,
    });
    game.settings.register('darksheet', 'wearDisplay', {
        name: 'Item Wear Display',
        hint: 'How an item\'s quality (worn / well-worn / scarred) is shown in the inventory.',
        scope: 'world',
        config: true,
        default: 'tag',
        type: String,
        choices: {
            tag: 'Name tag (default)',
            border: 'Colored icon border',
            cracks: 'Cracks on the icon (+ colored border)'
        },
    });
    game.settings.register('darksheet', 'equippedDontUseSlots', {
        name: 'Equipped Item Behaviour',
        hint: 'When enabled, equipped items dont count towards your carry capacity.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'slotCapacityFormula', {
        name: 'Inventory Slot Capacity Formula',
        hint: 'Controls how many inventory slots a character has when the slot-based inventory is enabled.',
        scope: 'world',
        config: true,
        default: DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr,
        type: String,
        choices: {
            [DARKSHEET_SLOT_CAPACITY_FORMULAS.flatStr]: 'Flat STR',
            [DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr]: 'Creature size + STR',
            [DARKSHEET_SLOT_CAPACITY_FORMULAS.sizeStr2]: 'Creature size + STR*2'
        },
        onChange: () => {
            globalThis.Darksheet?.darkScreenReload?.();
            Object.values(globalThis.ui?.windows ?? {}).forEach(app => {
                if (app?.actor?.type === "character") app.render(false);
            });
        }
    });
    /*game.settings.register('darksheet', 'ActiveInitiativeHadTurn', { //ACTIVE INITIATIVE
 name: 'Saved Active Initiative Value',
 hint: 'Do not modify. This value saves the turn order for Active Initiative.',
 scope: 'world',
 config: false,
 default: "",
 type: String,
 });
 game.settings.register('darksheet', 'activeInitiative', {
 name: 'Active Initiative [TESTING]',
 hint: 'Enables Active Initiative, a system for dynamic turn order during combat.',
 scope: 'world',
 config: true,
 default: false,
 type: Boolean,
 });
 game.settings.register('darksheet', 'activeInitiativeDisplayTurns', {
 name: 'Additional Active Initiative Display',
 hint: 'When enabled, additional actor information is displayed during Active Initiative.',
 scope: 'world',
 config: true,
 default: true,
 type: Boolean,
 });*/
    game.settings.register('darksheet', 'automaticSlots', {
        name: 'Automatic Slot Calculation',
        hint: 'When enabled, tries to automatically add slots to items in inventory by using a db.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'automaticFragility', {
        name: 'Automatic Item Fragility',
        hint: 'When enabled, tries to automatically add delicate and sturdy fragility to items in inventory by using a db.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'itemAutomationSlotTable', {
        name: 'Automatic Item Slot Table',
        hint: 'Internal storage for the editable automatic item slot lookup table.',
        scope: 'world',
        config: false,
        default: darksheetCloneData(itemBulk),
        type: Object,
    });
    game.settings.register('darksheet', 'itemAutomationFragileTable', {
        name: 'Automatic Fragile Item Table',
        hint: 'Internal storage for the editable automatic fragile item lookup table.',
        scope: 'world',
        config: false,
        default: darksheetCloneData(fragileItems),
        type: Object,
    });
    game.settings.registerMenu('darksheet', 'itemAutomationTables', {
        name: 'Automatic Item Tables',
        label: 'Configure Tables',
        hint: 'Edit which item names receive automatic slots and which names count as fragile.',
        scope: 'world',
        icon: 'fas fa-table-list',
        type: DarksheetItemAutomationTablesConfig,
        restricted: true
    });
    game.settings.register('darksheet', 'dreadMoodThresholds', {
        name: 'Dread Mood Texts',
        hint: 'Internal storage for player-facing Dread zone mood text thresholds.',
        scope: 'world',
        config: false,
        default: darksheetCloneData(DARKSHEET_DREAD_MOOD_DEFAULTS),
        type: Object,
        onChange: () => globalThis.Darksheet?.updateDreadZoneBanner?.()
    });
    game.settings.registerMenu('darksheet', 'dreadMoodTexts', {
        name: 'Dread Mood Texts',
        label: 'Configure Texts',
        hint: 'Edit the animated Dread banner text shown at different current dread amounts.',
        scope: 'world',
        icon: 'fas fa-comment-dots',
        type: DarksheetDreadMoodTextConfig,
        restricted: true
    });
    game.settings.register('darksheet', 'savecantrips', {
        name: 'Variant Rule: Safe Cantrips',
        hint: 'Disables the use of the d12 burnout die for cantrips when enabled.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hidenotches', {
        name: 'Hide Notches',
        hint: 'When enabled, the notches on inventory items and item sheets are hidden.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'disableItemDamage', {
        name: 'Disable item Damage',
        hint: 'Turns off the display of information for item damage, fragility, and condition in the inventory.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hideammodie', { //TODO hideammodie Setting
        name: 'Hide Ammunition Die',
        hint: 'When enabled, the ammunition die section is hidden from player inventories and item sheets.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hideWeaponQuantityOnItemSheet', {
        name: 'Hide Weapon Quantity in Inventory',
        hint: 'When enabled, the character inventory hides the quantity column for weapons, including the column header, to make more room for other weapon data.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });

    game.settings.register('darksheet', 'hidechecks', {
        name: 'Hide "Checks" Section from Character Sheets',
        hint: 'When enabled, the "checks" section is hidden from all character sheets.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'trainingSection', {
        name: 'Show Training Section on Character Sheets',
        hint: 'When enabled, the Darker Dungeons tab shows a Training track of 10 checkboxes for downtime training progress.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'journeyUnits', {
        name: 'Journey Distance Units',
        hint: 'Display travel distances in the Darkscreen journey planner as miles or kilometers. Existing journeys are stored in miles internally; switching units converts the display on the fly.',
        scope: 'world',
        config: true,
        default: 'miles',
        type: String,
        choices: { miles: 'Miles (10/15/20 per day)', km: 'Kilometers (16/24/32 per day)' },
        onChange: () => Darksheet.darkScreenReload?.()
    });
    game.settings.register('darksheet', 'darkscreenJourneyStore', {
        name: 'Darkscreen Journey Store',
        hint: 'Internal storage for saved Darkscreen journeys.',
        scope: 'world',
        config: false,
        default: { list: {}, activeId: null },
        type: Object,
    });
    game.settings.register('darksheet', 'darkscreenStore', {
        name: 'Darkscreen Store',
        hint: 'Internal storage for the Darker Dungeons GM screen.',
        scope: 'world',
        config: false,
        default: DARKSCREEN_STORE_DEFAULTS,
        type: Object,
        onChange: () => globalThis.Darksheet?.updateDreadZoneBanner?.()
    });
    /*game.settings.register('darksheet', 'nonpcattack', {//TODO NPCATTACK setting
 name: 'Disable NPC Attacks',
 hint: 'When enabled, only roll damage when using NPC attacks. This feature only supports the BetterNPCSheet5e module.',
 scope: 'world',
 config: true,
 default: false,
 type: Boolean,
 });*/
    game.settings.register('darksheet', 'smalldefense', {
        name: 'Variant Rule: Small Defense',
        hint: 'When enabled, smaller modifiers are used while playing with Active Defense. Defense Rolls: When you make a defense roll, roll a d20 and add your AC minus 10. The opposing DC is 12 plus the attackers normal attack bonus.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'destroyshatter', {
        name: 'Shattered Items Do Not Destroy',
        hint: 'When enabled, shattered items with [Shattered] in their name are kept instead of being deleted.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'shatterwhen1', {
        name: '[Houserule] Shatter When 1',
        hint: 'When enabled, items shatter when they reach 1 AC or 1 damage regardless of fragility.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'disableWoundSystem', {
        name: 'Disable Wound System',
        hint: 'Disables wounds and prevents them to be rendered on the sheet.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'silverstandard', {
        name: '[Houserule] Silver Standard',
        hint: 'When enabled, default item price denominations step down: gp becomes sp, and sp becomes cp.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'globalRegMagic', { //TODO GM MANAGED TEMPERATURE
    	name: 'GM-Managed Regional Magic',
    	hint: 'When enabled, players can no longer select regional magic on their character sheets. You can still change the regional magic as the GM or with the Darkscreen.',
    	scope: 'world',
    	config: true,
    	default: false,
    	type: Boolean,
    });
    //TODO IMPLEMENT DARKSCREEN
    /*game.settings.register('darksheet', 'globalTemp', { //TODO GM MANAGED TEMPERATURE
 name: 'GM-Managed Temperature',
 hint: 'When enabled, players can no longer select their temperature on their character sheets. You can still change the regional magic as the GM or with the Darkscreen.',
 scope: 'world',
 config: true,
 default: false,
 type: Boolean,
 });
 game.settings.register('darksheet', 'afflictionFromComp', { //TODO AFFLICTION AUTO APPLY
 name: 'Afflictions from Compendium',
 hint: 'When enabled, rolls from the Afflictions compendium instead of the rollable table and displays the compendium entry in chat.',
 scope: 'world',
 config: false,
 default: false,
 type: Boolean,
 });*/
    game.settings.register('darksheet', 'darkScreenPartyDisplay', {
        name: 'Online Character Filter',
        hint: 'Displays only the online characters in the party view',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
});

Hooks.once('init', () => {
    loadTemplates([
        'modules/darksheet/templates/Tab_DD.html',
        'modules/darksheet/templates/Tab_SpellBurnout.html',
        'modules/darksheet/templates/inventoryAdditions.html',
        'modules/darksheet/templates/fatigue.html',
        'modules/darksheet/templates/spellburnout.html',
        'modules/darksheet/templates/character-sheet.html'
    ]);
    registerDarkSheetTabPart();

    // Foundry v13+ removed the legacy `{{select}}` Handlebars helper that
    // Darksheet's templates rely on. Re-register a compatible implementation.
    if (typeof Handlebars !== 'undefined' && !Handlebars.helpers.select) {
        Handlebars.registerHelper('select', function(value, options) {
            const escapedValue = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const rgx = new RegExp(' value=[\"\\\']' + escapedValue + '[\"\\\']');
            const html = options.fn(this);
            return html.replace(rgx, '$& selected');
        });
    }
});

// Ensure the actor has the darksheet flag scaffolding before any helper reads it.
async function darksheetEnsureFlags(actor) {
    if (!actor) return;
    const ds = actor.flags?.darksheet;
    if (
        ds
        && ds.attributes
        && ds.attributes.temp !== undefined
        && ds.woundlist !== undefined
        && ds.displayOldWounds !== undefined
        && ds.exhaustionAutomation !== undefined
    ) return;
    const defaults = {
        attributes: {
            stress: 0,
            affliction1: { value: "default" },
            affliction2: { value: "default" },
            affliction3: { value: "default" },
            exhaustion: 0,
            saturation: "Sated",
            thirst: "Quenched",
            fatigue: "Rested",
            temp: "exwell",
            burnout: { value: "1d12" },
            autmomaticburnout: false
        },
        woundlist: [],
        displayOldWounds: false,
        exhaustionAutomation: {
            manual: 0,
            module: 0,
            applied: 0,
            sources: {}
        }
    };
    const current = actor.flags?.darksheet ?? {};
    await actor.update({
        'flags.darksheet': foundry.utils.mergeObject(defaults, current, { inplace: false, insertKeys: true, insertValues: true })
    }, { render: false });   // don't cascade-rerender - caller is mid-render
}

const DARKSHEET_EXHAUSTION_PENALTIES = {
    saturation: { foodstuffed: -1, foodhungry: 1, foodravenous: 1, foodstarving: 1 },
    thirst: { wquenched: -1, wthirsty: 1, wdry: 1, wdehydrated: 1 },
    fatigue: { exenegised: -1, exsleepy: 1, exvsleepy: 1, exbarely: 1 },
    temp: { exenegised: -1, exvsleepy: 1, exbarely: 1 }
};

function clampExhaustion(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(6, Math.trunc(number)));
}

function getActorExhaustion(actor) {
    const exhaustion = actor?.system?.attributes?.exhaustion;
    return clampExhaustion(exhaustion?.value ?? exhaustion ?? 0);
}

function calculateDarksheetExhaustion(actor) {
    const attrs = actor.flags?.darksheet?.attributes ?? {};
    const wounds = Array.isArray(actor.flags?.darksheet?.woundlist) && !game.settings.get('darksheet', 'disableWoundSystem')
        ? actor.flags.darksheet.woundlist.filter(wound => !wound.healed && !wound.treated).length
        : 0;
    const sources = {
        hunger: Number(DARKSHEET_EXHAUSTION_PENALTIES.saturation[attrs.saturation] ?? 0),
        thirst: Number(DARKSHEET_EXHAUSTION_PENALTIES.thirst[attrs.thirst] ?? 0),
        fatigue: Number(DARKSHEET_EXHAUSTION_PENALTIES.fatigue[attrs.fatigue] ?? 0),
        temperature: Number(DARKSHEET_EXHAUSTION_PENALTIES.temp[attrs.temp] ?? 0),
        wounds
    };
    const module = Object.values(sources).reduce((sum, value) => sum + Number(value || 0), 0);
    return { module, sources };
}

function darksheetExhaustionSourceText(actor) {
    const sources = actor.flags?.darksheet?.exhaustionAutomation?.sources ?? {};
    const parts = [];
    if (sources.hunger) parts.push(`Hunger ${sources.hunger > 0 ? "+" : ""}${sources.hunger}`);
    if (sources.thirst) parts.push(`Thirst ${sources.thirst > 0 ? "+" : ""}${sources.thirst}`);
    if (sources.fatigue) parts.push(`Fatigue ${sources.fatigue > 0 ? "+" : ""}${sources.fatigue}`);
    if (sources.temperature) parts.push(`Temperature ${sources.temperature > 0 ? "+" : ""}${sources.temperature}`);
    if (sources.wounds) parts.push(`Untreated wounds +${sources.wounds}`);
    return parts.length ? parts.join(", ") : "No Darksheet exhaustion sources";
}

function darksheetExhaustionBurdenText(actor) {
    const sources = actor.flags?.darksheet?.exhaustionAutomation?.sources ?? {};
    const parts = [];
    if (sources.hunger > 0) parts.push(`Hunger +${sources.hunger}`);
    if (sources.thirst > 0) parts.push(`Thirst +${sources.thirst}`);
    if (sources.fatigue > 0) parts.push(`Fatigue +${sources.fatigue}`);
    if (sources.temperature > 0) parts.push(`Temperature +${sources.temperature}`);
    if (sources.wounds > 0) parts.push(`Untreated wounds +${sources.wounds}`);
    return parts.join(", ");
}

function darksheetExhaustionBurdenAmount(actor) {
    const sources = actor.flags?.darksheet?.exhaustionAutomation?.sources ?? {};
    return Object.values(sources).reduce((sum, value) => {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? sum + number : sum;
    }, 0);
}

function darksheetExhaustionReliefText(actor) {
    const sources = actor.flags?.darksheet?.exhaustionAutomation?.sources ?? {};
    const parts = [];
    if (sources.hunger < 0) parts.push(`Stuffed ${sources.hunger}`);
    if (sources.thirst < 0) parts.push(`Quenched ${sources.thirst}`);
    if (sources.fatigue < 0) parts.push(`Energised ${sources.fatigue}`);
    if (sources.temperature < 0) parts.push(`Perfect temperature ${sources.temperature}`);
    return parts.join(", ");
}

function darksheetExhaustionReliefAmount(actor) {
    const sources = actor.flags?.darksheet?.exhaustionAutomation?.sources ?? {};
    return Object.values(sources).reduce((sum, value) => {
        const number = Number(value);
        return Number.isFinite(number) && number < 0 ? sum + Math.abs(number) : sum;
    }, 0);
}

async function syncDarksheetExhaustion(actor, { render = false } = {}) {
    if (!actor || actor.type !== "character") return null;
    if (actor._darksheetManualExhaustionBookkeeping) {
        const previous = actor.flags?.darksheet?.exhaustionAutomation ?? {};
        return {
            total: getActorExhaustion(actor),
            manual: clampExhaustion(previous.manual ?? 0),
            module: Number(previous.module ?? 0),
            applied: clampExhaustion(previous.applied ?? previous.module ?? 0),
            sources: previous.sources ?? {}
        };
    }
    await darksheetEnsureFlags(actor);
    const currentTotal = getActorExhaustion(actor);
    const previous = actor.flags?.darksheet?.exhaustionAutomation ?? {};
    const calculated = calculateDarksheetExhaustion(actor);
    const newAutomatable = Math.max(0, calculated.module);
    const prevAutomatableRaw = Number(previous.applied ?? previous.module ?? 0);
    const prevAutomatable = Number.isFinite(prevAutomatableRaw) ? Math.max(0, prevAutomatableRaw) : 0;
    // Apply only the CHANGE in automated exhaustion to the current total. This keeps
    // automation additive while never reverting a manual edit: a manual change to
    // exhaustion doesn't change automation, so the delta is 0 and the total stands.
    const delta = newAutomatable - prevAutomatable;
    const total = clampExhaustion(currentTotal + delta);
    const applied = newAutomatable;
    const manual = clampExhaustion(total - applied); // bookkeeping only
    const sourcesChanged = JSON.stringify(previous.sources ?? {}) !== JSON.stringify(calculated.sources);

    if (
        delta === 0
        && Number(previous.module ?? 0) === calculated.module
        && Number(previous.applied ?? previous.module ?? 0) === applied
        && !sourcesChanged
    ) {
        return { total, manual, module: calculated.module, applied, sources: calculated.sources };
    }

    await actor.update({
        'system.attributes.exhaustion': total,
        'flags.darksheet.exhaustionAutomation': {
            manual,
            module: calculated.module,
            applied,
            sources: calculated.sources
        }
    }, { diff: true, render, darksheetExhaustionSync: true });
    return { total, manual, module: calculated.module, applied, sources: calculated.sources };
}

function styleDarksheetExhaustionPips(sheet, html, actor) {
    const root = darksheetSheetRoot(sheet, html);
    if (!root) return;
    const applied = Number(actor.flags?.darksheet?.exhaustionAutomation?.applied ?? actor.flags?.darksheet?.exhaustionAutomation?.module ?? 0);
    const module = clampExhaustion(Math.max(0, applied));
    const sourceText = darksheetExhaustionSourceText(actor);
    const pips = Array.from(root.querySelectorAll('.pips[data-prop="system.attributes.exhaustion"] .pip[data-n]'));
    for (const pip of pips) {
        const pipNumber = Number(pip.dataset.n || 0);
        const isModule = pipNumber > 0 && pipNumber <= module;
        pip.classList.toggle("darksheet-module-exhaustion", isModule);
        if (isModule) {
            pip.disabled = false;
            pip.setAttribute("aria-disabled", "true");
            pip.setAttribute("tabindex", "-1");
            pip.dataset.darksheetTooltipOriginal ??= pip.dataset.tooltip ?? "";
            pip.dataset.tooltip = `Darksheet exhaustion (${module}): ${sourceText}`;
            pip.removeAttribute("title");
        } else {
            pip.disabled = false;
            pip.removeAttribute("aria-disabled");
            pip.removeAttribute("tabindex");
            pip.removeAttribute("title");
            if (pip.dataset.darksheetTooltipOriginal !== undefined) {
                if (pip.dataset.darksheetTooltipOriginal) pip.dataset.tooltip = pip.dataset.darksheetTooltipOriginal;
                else delete pip.dataset.tooltip;
                delete pip.dataset.darksheetTooltipOriginal;
            }
        }
    }
    const burden = darksheetExhaustionBurdenAmount(actor);
    const burdenText = darksheetExhaustionBurdenText(actor);
    const relief = darksheetExhaustionReliefAmount(actor);
    const reliefText = darksheetExhaustionReliefText(actor);
    const firstPipGroup = root.querySelector('.pips[data-prop="system.attributes.exhaustion"]');
    let burdenBadge = root.querySelector(".darksheet-exhaustion-burden");
    if (burden > 0 && burdenText && firstPipGroup) {
        if (!burdenBadge) {
            burdenBadge = document.createElement("span");
            burdenBadge.className = "darksheet-exhaustion-badge darksheet-exhaustion-burden";
        }
        if (burdenBadge.parentElement !== firstPipGroup) firstPipGroup.append(burdenBadge);
        burdenBadge.textContent = `+${burden}`;
        burdenBadge.dataset.tooltip = `Darksheet exhaustion burden (+${burden}): ${burdenText}`;
        burdenBadge.removeAttribute("title");
    } else if (burdenBadge) {
        burdenBadge.remove();
    }
    let reliefBadge = root.querySelector(".darksheet-exhaustion-relief");
    if (relief > 0 && reliefText && firstPipGroup) {
        if (!reliefBadge) {
            reliefBadge = document.createElement("span");
            reliefBadge.className = "darksheet-exhaustion-badge darksheet-exhaustion-relief";
        }
        if (reliefBadge.parentElement !== firstPipGroup) firstPipGroup.append(reliefBadge);
        const tooltip = `Darksheet exhaustion relief (-${relief}): ${reliefText}`;
        reliefBadge.textContent = `-${relief}`;
        reliefBadge.dataset.tooltip = tooltip;
        reliefBadge.removeAttribute("title");
    } else if (reliefBadge) {
        reliefBadge.remove();
    }
    if (!root.dataset.darksheetExhaustionPipGuard) {
        root.dataset.darksheetExhaustionPipGuard = "true";
        root.addEventListener("click", event => {
            const pip = event.target.closest?.(".pip.darksheet-module-exhaustion");
            if (!pip) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);
    }
}

// Shared render handler for both legacy ActorSheet (V1) and dnd5e 5.x V2 sheets.
async function darksheetRenderActorSheet(app, html, data) {
    if (app.actor?.type != 'character') return;
    darksheetScheduleEncumbranceSync(app.actor, { delay: 250 });
    // dnd5e 5.x / Foundry v14 ApplicationV2 sheets pass html as an HTMLElement.
    // Wrap it in jQuery so the rest of the module (which is jQuery-based) keeps working.
    if (!(html instanceof jQuery)) html = $(html);
    // Ensure the actor has the darksheet flag scaffolding the rest of the
    // module assumes is present (new actors won't have it yet).
    await darksheetEnsureFlags(app.actor);
    if (!app.actor._darksheetManualExhaustionBookkeeping) {
        await syncDarksheetExhaustion(app.actor, { render: false });
    }
    const element = document.querySelector('a.item.active');
    if (element) {
        element.focus();
    }

    addStressBar(app, html, data);
    applySpellBurnoutToSheet(app, html, data);
    applyWeaponInventoryQuantityVisibility(app, html);

    darkSheetSetup(app, html, data);
    darksheetInjectGemButtons(app, html);
    darksheetInjectInspiration(app, html);
    darksheetColorInventoryPrices(app, html);
    if (!game.settings.get('darksheet', 'disableWoundSystem')) {
        addWoundsToSheet(app, html, data);
    }
    styleDarksheetExhaustionPips(app, html, app.actor);
    setTimeout(() => {
        // Blur the active element after reload
        document.activeElement.blur();
    }, 0);
}
// Legacy V1 sheet hook (older Foundry / older dnd5e). ApplicationV2 sheets
// also pass an HTMLElement here in some setups, but the specific hook below
// handles those; skipping prevents double work during character sheet renders.
Hooks.on('renderActorSheet', (app, html, data) => {
    if (app?.actor?.type === "character" && typeof HTMLElement !== "undefined" && html instanceof HTMLElement) return;
    return darksheetRenderActorSheet(app, html, data);
});
// dnd5e 5.x V2 sheets - listen to the *most specific* hook only.
// renderBaseActorSheet would also fire for CharacterActorSheet, causing the
// handler to run twice per render (stress bar duplicated, etc.).
Hooks.on('renderCharacterActorSheet', darksheetRenderActorSheet);

// ===== Monster loot generation (DSLOOT) =====
// Adds a GM-only "Generate Loot" button to NPC sheets. It reads the prepared
// darksheet/data/srd-monster-materials.json and adds loot to the monster by:
// 1. NAME match -> that monster's signature harvest materials,
// 2. TYPE match -> a CR-appropriate generic material for the creature type,
// 3. humanoids -> roll a loot tier (currency + mundane gear).
const DSLOOT = {
    DATA_PATH: "modules/darksheet/data/srd-monster-materials.json",
    _data: null,
    _dndIndex: null,
    RAR_MAP: { "Common": "common", "Uncommon": "uncommon", "Rare": "rare", "Very rare": "veryRare", "Legendary": "legendary", "Unique": "artifact" },
    async load() {
        if (this._data) return this._data;
        try { this._data = this._applyEssences(await foundry.utils.fetchJsonWithTimeout(this.DATA_PATH)); }
        catch (e) { console.error("Darksheet | failed to load monster loot data", e); this._data = null; }
        return this._data;
    },
    // Otherworldly creature types yield a harvestable "essence" (substance
    // Otherworldly), themed by plane/element. Mirrors _build/srd-monsters.js so
    // harvest and the compendium stay consistent. Mundane types never get one.
    OTHERWORLDLY: ["aberration", "celestial", "elemental", "fey", "fiend", "undead"],
    ESS_WORD: { Common: "Crude", Uncommon: "Fine", Rare: "Greater", "Very rare": "Superior", Legendary: "Mythic", Unique: "Ascendant" },
    ELEM_WORD: { Air: "Gale", Earth: "Stone", Fire: "Fire", Force: "Arcane", Lightning: "Storm", Necrotic: "Grave", None: "Primal", Psychic: "Mind", Radiant: "Radiant", Water: "Tidal" },
    ESS_THEME: { celestial: { word: "Divine", element: "Radiant" }, fiend: { word: "Abyssal", element: "Necrotic" }, fey: { word: "Fey", element: "Psychic" }, aberration: { word: "Aberrant", element: "Psychic" }, undead: { word: "Grave", element: "Necrotic" } },
    ESS_ICON: { Fire: "icons/magic/fire/projectile-fireball-orange.webp", Water: "icons/magic/water/orb-ice-glow.webp", Lightning: "icons/magic/lightning/orb-ball-purple.webp", Air: "icons/magic/air/wind-tornado-funnel-blue.webp", Earth: "icons/magic/earth/orb-stone-smoke-teal.webp", Radiant: "icons/magic/holy/prayer-hands-glowing-yellow.webp", Necrotic: "icons/magic/unholy/orb-beam-pink.webp", Psychic: "icons/magic/control/hypnosis-mesmerism-eye-tan.webp", Force: "icons/magic/symbols/runes-star-magenta.webp", None: "icons/magic/symbols/elements-air-earth-fire-water.webp" },
    _crRarityLabel(cr) { const c = Number(cr) || 0; if (c < 2) return "Common"; if (c < 5) return "Uncommon"; if (c < 11) return "Rare"; if (c < 17) return "Very rare"; return "Legendary"; },
    _essenceFor(m) {
        const type = (m.stats?.type || "").toLowerCase();
        if (!this.OTHERWORLDLY.includes(type)) return null;
        const rarityLabel = m.materials?.[0]?.properties?.rarity || this._crRarityLabel(m.stats?.cr);
        let elementLabel, word;
        if (type === "elemental") {
            elementLabel = m.materials?.[0]?.properties?.element || "None";
            if (elementLabel === "None") {
                const n = (m.name || "").toLowerCase();
                if (/fire|magma|lava|ember|smoke|ash/.test(n)) elementLabel = "Fire";
                else if (/water|ice|frost|cold|steam|tide/.test(n)) elementLabel = "Water";
                else if (/air|wind|storm|cloud/.test(n)) elementLabel = "Air";
                else if (/earth|stone|dust|rock|mud/.test(n)) elementLabel = "Earth";
                else if (/thunder|spark|shock/.test(n)) elementLabel = "Lightning";
            }
            word = this.ELEM_WORD[elementLabel] || "Primal";
        } else {
            const t = this.ESS_THEME[type];
            elementLabel = t.element; word = t.word;
        }
        const name = `${this.ESS_WORD[rarityLabel] || "Crude"} ${word} Essence`;
        const id = "essence-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return {
            id, name,
            properties: { rarity: rarityLabel, substance: "Otherworldly", element: elementLabel },
            icon: this.ESS_ICON[elementLabel] || "icons/magic/unholy/orb-beam-pink.webp",
            measure: "1 small item",
            description: `A bound mote of ${word.toLowerCase()} power, harvested only from ${type}s.`
        };
    },
    _applyEssences(json) {
        if (!json?.monsters) return json;
        for (const m of json.monsters) {
            const e = this._essenceFor(m);
            if (!e) continue;
            m.materials = Array.isArray(m.materials) ? m.materials : [];
            if (!m.materials.some(x => x.id === e.id)) m.materials.push(e);
        }
        return json;
    },
    norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); },
    // CR -> the generic-material rarity tier to pull for a type match.
    rarityForCR(cr) { const c = Number(cr) || 0; if (c < 2) return "Common"; if (c < 5) return "Uncommon"; if (c < 11) return "Rare"; if (c < 17) return "Very rare"; return "Legendary"; },
    creatureType(actor) {
        const t = actor.system?.details?.type;
        let v = (typeof t === "string") ? t : (t?.value || "");
        v = String(v || "").toLowerCase();
        if (!v && t?.custom) v = String(t.custom).toLowerCase();
        return v;
    },
    // Name match: exact (normalised) first, then containment either way so
    // "Red Dragon" still finds "Adult Red Dragon" etc.
    matchMonster(json, name) {
        const an = this.norm(name);
        if (!an) return null;
        let best = json.monsters.find(m => this.norm(m.name) === an);
        if (!best) best = json.monsters.find(m => { const mn = this.norm(m.name); return mn && (an.includes(mn) || mn.includes(an)); });
        return best || null;
    },
    genericFor(json, type, rarityLabel) {
        const t = json.genericMonsterTypeMaterials?.types?.find(x => x.type === type);
        if (!t) return null;
        return t.materials.find(m => m.properties.rarity === rarityLabel) || t.materials[0] || null;
    },
    humanoidTierForCR(json, cr) {
        const c = Number(cr) || 0;
        let idx; if (c < 0.5) idx = 1; else if (c < 1) idx = 2; else if (c < 3) idx = 3; else if (c < 5) idx = 4; else if (c < 7) idx = 5; else if (c < 9) idx = 6; else if (c < 12) idx = 7; else if (c < 15) idx = 8; else if (c < 19) idx = 9; else idx = 10;
        return json.humanoidLootTiers?.tiers?.find(t => t.tier === idx) || null;
    },
    matToItem(mm, srdFlag, hidden = false) {
        const rarity = this.RAR_MAP[mm.properties.rarity] || "common";
        const substance = String(mm.properties.substance || "").toLowerCase();
        const element = String(mm.properties.element || "none").toLowerCase();
        const material = { rarity, substance, element, hidden: !!hidden };
        const source = { ...(srdFlag || {}), hidden: !!hidden };
        return { name: mm.name, type: "loot", img: mm.icon, system: { quantity: 1, identified: true, price: { value: 0, denomination: "gp" }, description: { value: `<p><em>Harvested crafting material.</em></p><p>${mm.description || ""}</p>`, chat: "" } }, flags: { darksheet: { material, srdMat: source } } };
    },
    rint(min, max) { min = Number(min) || 0; max = Number(max) || 0; if (max < min) max = min; return min + Math.floor(Math.random() * (max - min + 1)); },
    rollQty(q) {
        if (q == null) return 1;
        const s = String(q).trim();
        if (/^\d+$/.test(s)) return Number(s);
        const range = s.match(/^(\d+)\s*-\s*(\d+)(?:\b|[^0-9])/);
        if (range) return this.rint(Number(range[1]), Number(range[2]));
        const dice = s.match(/^(\d+)d(\d+)(?:\b|[^0-9])/i);
        if (dice) {
            let n = 0;
            for (let i = 0; i < Number(dice[1]); i++) n += 1 + Math.floor(Math.random() * Number(dice[2]));
            return n;
        }
        return 1;
    },
    async dndIndex() {
        if (this._dndIndex !== null) return this._dndIndex;
        const pack = game.packs.get("dnd5e.items");
        this._dndIndex = pack ? await pack.getIndex() : false;
        return this._dndIndex;
    },
    // A real dnd5e item if the gear name resolves; otherwise a plain loot stand-in.
    async gearItem(name, qty) {
        const idx = await this.dndIndex();
        if (idx) {
            const entry = [...idx].find(e => String(e.name).toLowerCase() === String(name).toLowerCase());
            if (entry) { const doc = await game.packs.get("dnd5e.items").getDocument(entry._id); const obj = doc.toObject(); delete obj._id; foundry.utils.setProperty(obj, "system.quantity", qty); return obj; }
        }
        return { name, type: "loot", img: "icons/containers/bags/sack-cloth-tan.webp", system: { quantity: qty, identified: true, description: { value: "", chat: "" } } };
    },
    async generateImmediate(actor) {
        if (!actor) return;
        const json = await this.load();
        if (!json) return ui.notifications.error("Darksheet | Could not load monster loot data.");
        if (actor.getFlag("darksheet", "lootGenerated")) {
            const ok = await Dialog.confirm({ title: "Generate Loot", content: `<p><strong>${actor.name}</strong> already has generated loot. Add another batch?</p>` });
            if (!ok) return;
        }
        const type = this.creatureType(actor);
        const cr = actor.system?.details?.cr;
        const items = [], lines = [];
        // 1. monster-specific (name match)
        const mon = this.matchMonster(json, actor.name);
        if (mon) for (const mm of (mon.materials || [])) {
            items.push(this.matToItem(mm, { kind: "monster", monster: mon.name, creatureType: type || mon.stats?.type, cr: mon.stats?.cr }));
            lines.push(`<li>${mm.name} <em>(${mm.properties.rarity} ${String(mm.properties.substance).toLowerCase()})</em></li>`);
        }
        // 2. generic (type match), CR-appropriate
        const gen = this.genericFor(json, type, this.rarityForCR(cr)) || this.genericFor(json, type, "Common");
        if (gen) { items.push(this.matToItem(gen, { kind: "generic", creatureType: type })); lines.push(`<li>${gen.name} <em>(${gen.properties.rarity}, generic ${type})</em></li>`); }
        // 3. humanoids: loot tier currency + mundane gear
        if (type === "humanoid") {
            const tier = this.humanoidTierForCR(json, cr);
            if (tier) {
                const cur = {}; for (const c of ["pp", "gp", "ep", "sp", "cp"]) { const r = tier.currency?.[c]; const n = r ? this.rint(r.min, r.max) : 0; if (n) cur[c] = n; }
                let curMsg = "";
                if (Object.keys(cur).length) { const upd = {}; for (const c in cur) upd[`system.currency.${c}`] = (actor.system?.currency?.[c] || 0) + cur[c]; await actor.update(upd); curMsg = Object.entries(cur).map(([c, n]) => `${n} ${c}`).join(", "); }
                for (const it of (tier.items || [])) {
                    const qty = this.rollQty(it.quantity);
                    if (qty > 0) items.push(await this.gearItem(it.name, qty));
                }
                lines.push(`<li><em>${tier.label} tier:</em> ${curMsg || "no coin"}${tier.items?.length ? `, ${tier.items.length} gear item(s)` : ""}</li>`);
            }
        }
        if (!items.length) return ui.notifications.warn(`Darksheet | No loot matched for ${actor.name} (type "${type || "?"}").`);
        await actor.createEmbeddedDocuments("Item", items);
        await actor.setFlag("darksheet", "lootGenerated", true);
        const matchNote = mon ? `matched <strong>${mon.name}</strong>` : `no name match \u2014 generic ${type || "?"} only`;
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
            content: `<div class="darksheet-loot-card"><h3><i class="fas fa-sack-dollar"></i> Loot for ${actor.name}</h3><p>${matchNote} (CR ${cr ?? "?"}).</p><ul>${lines.join("")}</ul></div>`
        });
        ui.notifications.info(`Darksheet | Generated loot for ${actor.name}.`);
    },
    esc(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    },
    planFor(actor, json) {
        const type = this.creatureType(actor);
        const cr = actor.system?.details?.cr;
        const rarityLabel = this.rarityForCR(cr);
        const mon = this.matchMonster(json, actor.name);
        const gen = this.genericFor(json, type, rarityLabel) || this.genericFor(json, type, "Common");
        const tier = type === "humanoid" ? this.humanoidTierForCR(json, cr) : null;
        return { actor, json, type, cr, rarityLabel, mon, gen, tier };
    },
    materialChoices(plan) {
        const choices = [];
        for (const [i, mm] of (plan.mon?.materials || []).entries()) choices.push({ key: `monster-${i}`, source: "monster", label: plan.mon.name, weight: 100, mm });
        if (plan.gen) choices.push({ key: "generic-0", source: "generic", label: `Generic ${plan.type || "creature"}`, weight: plan.mon ? 50 : 100, mm: plan.gen });
        return choices;
    },
    materialTag(mm) {
        return [mm?.properties?.rarity, mm?.properties?.substance, mm?.properties?.element && mm.properties.element !== "None" ? mm.properties.element : ""].filter(Boolean).join(" / ");
    },
    materialFlag(choice, plan) {
        if (choice.source === "monster") return { kind: "monster", monster: plan.mon?.name, creatureType: plan.type || plan.mon?.stats?.type, cr: plan.mon?.stats?.cr };
        return { kind: "generic", creatureType: plan.type, cr: plan.cr };
    },
    currencyRangeText(tier) {
        const parts = [];
        for (const c of ["pp", "gp", "ep", "sp", "cp"]) {
            const r = tier?.currency?.[c];
            if (!r) continue;
            const min = Number(r.min) || 0, max = Number(r.max) || 0;
            if (min || max) parts.push(min === max ? `${min} ${c}` : `${min}-${max} ${c}`);
        }
        return parts.join(", ") || "no coin";
    },
    rollCurrency(tier) {
        const out = {};
        for (const c of ["pp", "gp", "ep", "sp", "cp"]) {
            const r = tier?.currency?.[c];
            const n = r ? this.rint(r.min, r.max) : 0;
            if (n) out[c] = n;
        }
        return out;
    },
    dialogContent(actor, plan) {
        const choices = this.materialChoices(plan);
        const already = actor.getFlag("darksheet", "lootGenerated");
        const materialRows = choices.map(choice => {
            const mm = choice.mm || {};
            const img = this.esc(mm.icon || "icons/commodities/materials/bowl-powder-blue.webp");
            return `<div class="dsloot-row">
                <input type="checkbox" data-dsloot-material="${this.esc(choice.key)}" checked title="Add this material">
                <img src="${img}" alt="">
                <div class="dsloot-row__main">
                    <strong>${this.esc(mm.name || "Material")}</strong>
                    <span>${this.esc(choice.label)} - ${this.esc(this.materialTag(mm))}</span>
                    ${mm.description ? `<small>${this.esc(mm.description)}</small>` : ""}
                </div>
                <label class="dsloot-qty">Qty <input type="number" min="1" max="99" value="1" data-dsloot-qty="${this.esc(choice.key)}"></label>
                <label class="dsloot-vis" title="Visible to players in harvest/material hints">
                    <input type="checkbox" data-dsloot-visible="${this.esc(choice.key)}" checked>
                    <i class="fas fa-eye dsloot-vis__show"></i>
                    <i class="fas fa-eye-slash dsloot-vis__hide"></i>
                </label>
            </div>`;
        }).join("") || `<div class="dsloot-empty">No material match for this creature.</div>`;
        const humanoid = plan.tier ? `<section class="dsloot-section">
            <h4><i class="fas fa-coins"></i> Humanoid Loot Tier ${plan.tier.tier}: ${this.esc(plan.tier.label)}</h4>
            <label class="dsloot-check"><input type="checkbox" name="includeCoin" checked> Roll carried coin (${this.esc(this.currencyRangeText(plan.tier))})</label>
            <label class="dsloot-check"><input type="checkbox" name="includeGear" checked> Add mundane gear (${Number(plan.tier.items?.length || 0)} entries)</label>
        </section>` : "";
        const matchNote = plan.mon ? `Matched ${this.esc(plan.mon.name)}` : `No exact monster match - using ${this.esc(plan.type || "unknown type")} fallback`;
        return `<div class="dsloot-dialog">
            <div class="dsloot-summary">
                <img src="${this.esc(actor.img || "icons/svg/mystery-man.svg")}" alt="">
                <div><h3>${this.esc(actor.name)}</h3><p>${matchNote}</p><p>CR ${this.esc(plan.cr ?? "?")} - ${this.esc(plan.type || "unknown")} - ${this.esc(plan.rarityLabel)}</p></div>
            </div>
            ${already ? `<div class="dsloot-warning"><i class="fas fa-triangle-exclamation"></i> Loot was already generated for this actor. Adding loot again will create another batch.</div>` : ""}
            <section class="dsloot-section">
                <h4><i class="fas fa-cubes"></i> Materials</h4>
                <div class="dsloot-list">${materialRows}</div>
            </section>
            ${humanoid}
            <label class="dsloot-check dsloot-chat"><input type="checkbox" name="postChat" checked> Post GM chat summary</label>
        </div>`;
    },
    readDialogOptions(html) {
        const root = html?.[0] ?? html;
        const materialKeys = new Set(Array.from(root?.querySelectorAll?.("[data-dsloot-material]:checked") || []).map(el => el.dataset.dslootMaterial));
        const hiddenKeys = new Set(Array.from(root?.querySelectorAll?.("[data-dsloot-visible]:not(:checked)") || []).map(el => el.dataset.dslootVisible));
        const materialQty = {};
        for (const input of Array.from(root?.querySelectorAll?.("[data-dsloot-qty]") || [])) materialQty[input.dataset.dslootQty] = Math.max(1, Math.min(99, Number(input.value) || 1));
        return {
            materialKeys,
            hiddenKeys,
            materialQty,
            includeCoin: !!root?.querySelector?.("[name='includeCoin']")?.checked,
            includeGear: !!root?.querySelector?.("[name='includeGear']")?.checked,
            postChat: !!root?.querySelector?.("[name='postChat']")?.checked
        };
    },
    selectedMaterialChoices(plan, options) {
        return this.materialChoices(plan).filter(choice => options.materialKeys.has(choice.key));
    },
    async open(actor) {
        if (!actor) return;
        const json = await this.load();
        if (!json) return ui.notifications.error("Darksheet | Could not load monster loot data.");
        const plan = this.planFor(actor, json);
        if (!this.materialChoices(plan).length && !plan.tier) return ui.notifications.warn(`Darksheet | No loot matched for ${actor.name} (type "${plan.type || "?"}").`);
        new Dialog({
            title: `Darker Dungeons: Generate Loot`,
            content: this.dialogContent(actor, plan),
            buttons: {
                add: { icon: '<i class="fas fa-sack-dollar"></i>', label: "Add Loot", callback: html => this.applyLoot(actor, plan, this.readDialogOptions(html)) }
            },
            default: "add"
        }, { classes: ["darksheet-loot-dialog"], width: 560 }).render(true);
    },
    async generate(actor) {
        return this.open(actor);
    },
    async applyLoot(actor, plan, options) {
        if (actor.getFlag("darksheet", "lootGenerated")) {
            const ok = await Dialog.confirm({ title: "Generate Loot", content: `<p><strong>${this.esc(actor.name)}</strong> already has generated loot. Add another batch?</p>` });
            if (!ok) return;
        }
        const lines = [];
        let changed = false;
        for (const choice of this.selectedMaterialChoices(plan, options)) {
            const qty = options.materialQty[choice.key] || 1;
            const hidden = options.hiddenKeys?.has(choice.key);
            const data = this.matToItem(choice.mm, this.materialFlag(choice, plan), hidden);
            await darksheetGrantStackableItem(actor, data, qty);
            lines.push(`<li>${hidden ? `<i class="fas fa-eye-slash"></i> ` : ""}${this.esc(choice.mm.name)} x${qty} <em>(${this.esc(this.materialTag(choice.mm))}${hidden ? ", hidden" : ""})</em></li>`);
            changed = true;
        }
        if (plan.tier && options.includeCoin) {
            const cur = this.rollCurrency(plan.tier);
            if (Object.keys(cur).length) {
                const upd = {};
                for (const c in cur) upd[`system.currency.${c}`] = (actor.system?.currency?.[c] || 0) + cur[c];
                await actor.update(upd);
                lines.push(`<li><em>Coin:</em> ${this.esc(Object.entries(cur).map(([c, n]) => `${n} ${c}`).join(", "))}</li>`);
                changed = true;
            }
        }
        if (plan.tier && options.includeGear) {
            const gear = [];
            for (const it of (plan.tier.items || [])) {
                const qty = this.rollQty(it.quantity);
                if (qty > 0) gear.push(await this.gearItem(it.name, qty));
            }
            if (gear.length) {
                await actor.createEmbeddedDocuments("Item", gear);
                lines.push(`<li><em>Gear:</em> ${this.esc(gear.map(it => `${foundry.utils.getProperty(it, "system.quantity") || 1}x ${it.name}`).join(", "))}</li>`);
                changed = true;
            }
        }
        if (!changed) return ui.notifications.warn("Darksheet | Select at least one loot option.");
        await actor.setFlag("darksheet", "lootGenerated", true);
        if (options.postChat) {
            const matchNote = plan.mon ? `matched <strong>${this.esc(plan.mon.name)}</strong>` : `generic ${this.esc(plan.type || "?")} fallback`;
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor }),
                whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
                content: `<div class="darksheet-loot-card"><h3><i class="fas fa-sack-dollar"></i> Loot for ${this.esc(actor.name)}</h3><p>${matchNote} (CR ${this.esc(plan.cr ?? "?")}).</p><ul>${lines.join("")}</ul></div>`
            });
        }
        ui.notifications.info(`Darksheet | Generated loot for ${actor.name}.`);
    }
};
window.DarksheetLoot = DSLOOT;

// GM-only "Generate Loot" header button on NPC (monster) sheets.
function darksheetRenderNpcSheet(app, html) {
    const actor = app?.actor;
    if (actor?.type !== "npc" || !game.user.isGM) return;
    const root = app.element instanceof HTMLElement ? app.element : (app.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
    if (!root || root.querySelector(".darksheet-genloot-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "header-control icon darksheet-genloot-btn";
                btn.dataset.tooltip = "Generate Loot";
    btn.setAttribute("aria-label", "Generate Loot");
    btn.innerHTML = `<i class="fas fa-sack-dollar"></i>`;
    btn.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); DSLOOT.generate(actor); });
    const header = root.querySelector(".window-header");
    if (header) { const anchor = header.querySelector('[data-action="close"]'); header.insertBefore(btn, anchor || null); }
    else root.prepend(btn);
}
Hooks.on("renderNPCActorSheet", darksheetRenderNpcSheet);
Hooks.on("renderActorSheet", (app, html) => { if (app?.actor?.type === "npc") darksheetRenderNpcSheet(app, html); });

// Show crafting-material tags (rarity / substance / element) as native pills in
// the dnd5e item hover tooltip. Materials are "loot" items; we append our tags to
// the tooltip card's `properties`, which renders them in the same pill row dnd5e
// uses for weapon properties etc.
Hooks.once("setup", () => {
    darksheetRegisterEncumbranceStatusEffects();
    const lootModel = CONFIG?.Item?.dataModels?.loot;
    if (!lootModel?.prototype?.getCardData) { console.warn("Darksheet | loot getCardData not found; material tooltips disabled."); return; }
    const RAR_LABEL = { common: "Common", uncommon: "Uncommon", rare: "Rare", veryRare: "Very Rare", legendary: "Legendary", artifact: "Unique" };
    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    const materialTags = (mat) => {
        const tags = [];
        if (mat.rarity) tags.push(RAR_LABEL[mat.rarity] || cap(mat.rarity));
        if (mat.substance) tags.push(cap(mat.substance));
        if (mat.element && mat.element !== "none") tags.push(cap(mat.element));
        return tags;
    };
    const inject = (item, ctx) => {
        const mat = item?.flags?.darksheet?.material;
        if (!mat) return ctx;
        ctx.properties = [...(ctx.properties || []), ...materialTags(mat)];
        ctx.hasProperties = !!(ctx.tags?.length || ctx.properties.length);
        return ctx;
    };
    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("darksheet", "CONFIG.Item.dataModels.loot.prototype.getCardData", async function (wrapped, ...args) {
            return inject(this.parent, await wrapped(...args));
        }, "WRAPPER");
    } else {
        const orig = lootModel.prototype.getCardData;
        lootModel.prototype.getCardData = async function (...args) {
            return inject(this.parent, await orig.apply(this, args));
        };
    }
});

function darksheetFlattenChange(changed) {
    return foundry.utils.flattenObject?.(changed ?? {}) ?? {};
}

function darksheetUpdateTouchesManualExhaustion(keys) {
    return keys.includes("system.attributes.exhaustion")
        || keys.some(key => key.startsWith("system.attributes.exhaustion."));
}

function darksheetUpdateTouchesExhaustionSources(keys) {
    return keys.some(key =>
        key.startsWith("flags.darksheet.attributes.saturation")
        || key.startsWith("flags.darksheet.attributes.thirst")
        || key.startsWith("flags.darksheet.attributes.fatigue")
        || key.startsWith("flags.darksheet.attributes.temp")
        || key.startsWith("flags.darksheet.woundlist")
    );
}

function darksheetUpdateTouchesExhaustionAutomation(keys) {
    return keys.some(key => key.startsWith("flags.darksheet.exhaustionAutomation"));
}

async function darksheetRememberManualExhaustion(actor, changed) {
    if (!actor || actor.type !== "character") return null;
    const flattened = darksheetFlattenChange(changed);
    const rawTotal = flattened["system.attributes.exhaustion"]
        ?? flattened["system.attributes.exhaustion.value"]
        ?? foundry.utils.getProperty?.(changed ?? {}, "system.attributes.exhaustion.value")
        ?? foundry.utils.getProperty?.(changed ?? {}, "system.attributes.exhaustion")
        ?? actor.system?.attributes?.exhaustion?.value
        ?? actor.system?.attributes?.exhaustion
        ?? 0;
    await darksheetEnsureFlags(actor);
    const total = clampExhaustion(rawTotal);
    const calculated = calculateDarksheetExhaustion(actor);
    const applied = clampExhaustion(Math.max(0, calculated.module));
    const manual = clampExhaustion(total - applied);
    const previous = actor.flags?.darksheet?.exhaustionAutomation ?? {};
    const sourcesChanged = JSON.stringify(previous.sources ?? {}) !== JSON.stringify(calculated.sources);

    if (
        Number(previous.manual ?? 0) === manual
        && Number(previous.module ?? 0) === calculated.module
        && Number(previous.applied ?? previous.module ?? 0) === applied
        && !sourcesChanged
    ) {
        return { total, manual, module: calculated.module, applied, sources: calculated.sources };
    }

    await actor.update({
        'flags.darksheet.exhaustionAutomation': {
            manual,
            module: calculated.module,
            applied,
            sources: calculated.sources
        }
    }, { diff: true, render: false, darksheetManualExhaustionBookkeeping: true });
    return { total, manual, module: calculated.module, applied, sources: calculated.sources };
}

Hooks.on("createActiveEffect", effect => {
    const actor = effect?.parent;
    if (darksheetEffectHasEncumbranceStatus(effect)) darksheetScheduleEncumbranceSync(actor, { delay: 50 });
});
Hooks.on("deleteActiveEffect", effect => {
    const actor = effect?.parent;
    if (darksheetEffectHasEncumbranceStatus(effect)) darksheetScheduleEncumbranceSync(actor, { delay: 50 });
});
Hooks.on("dnd5e.postPrepareActorData", actor => darksheetScheduleEncumbranceSync(actor, { delay: 50 }));

Hooks.on("updateActor", (actor, changed, options) => {
    if (!options?.darksheetEncumbranceSync) darksheetScheduleEncumbranceSync(actor);
    if (options?.darksheetExhaustionSync || options?.darksheetManualExhaustionBookkeeping) return;
    if (actor?.type !== "character") return;
    const keys = Object.keys(darksheetFlattenChange(changed));
    const touchesManual = darksheetUpdateTouchesManualExhaustion(keys);
    const touchesSources = darksheetUpdateTouchesExhaustionSources(keys);
    const touchesAutomation = darksheetUpdateTouchesExhaustionAutomation(keys);
    if (!touchesManual && !touchesSources && !touchesAutomation) return;

    if (touchesManual && !touchesSources && !touchesAutomation) {
        const token = Symbol("darksheetManualExhaustionBookkeeping");
        actor._darksheetManualExhaustionBookkeeping = token;
        void darksheetRememberManualExhaustion(actor, changed)
            .catch(error => console.warn("Darksheet | Failed to remember manual exhaustion.", error))
            .finally(() => {
                if (actor._darksheetManualExhaustionBookkeeping === token) {
                    delete actor._darksheetManualExhaustionBookkeeping;
                }
            });
        return;
    }

    void syncDarksheetExhaustion(actor, { render: false })
        .catch(error => console.warn("Darksheet | Failed to sync exhaustion.", error));
});

function registerDarkSheetTabPart() {
    const CharacterActorSheet = applications.actor?.CharacterActorSheet;
    if (!CharacterActorSheet) {
        console.warn("Darksheet | dnd5e CharacterActorSheet was not available; Darker Dungeons tab was not registered.");
        return;
    }

    if (!CharacterActorSheet.TABS.some(tab => tab.tab === "dd")) {
        const tabs = [...CharacterActorSheet.TABS];
        const ddTab = { tab: "dd", label: "Darker Dungeons", icon: "fas fa-skull" };
        const detailsIdx = tabs.findIndex(t => t.tab === "details");
        if (detailsIdx >= 0) tabs.splice(detailsIdx + 1, 0, ddTab);
        else tabs.push(ddTab);
        CharacterActorSheet.TABS = tabs;
    }

    const parts = {};
    for (const [partId, part] of Object.entries(CharacterActorSheet.PARTS)) {
        parts[partId] = part;
        if (partId === "spells") {
            parts.spellBurnout = {
                container: { classes: ["tab-body"], id: "tabs" },
                template: "modules/darksheet/templates/Tab_SpellBurnout.html",
                templates: ["modules/darksheet/templates/spellburnout.html"],
                scrollable: [""]
            };
        }
    }

    CharacterActorSheet.PARTS = {
        ...parts,
        dd: {
            classes: ["flexcol"],
            container: { classes: ["tab-body"], id: "tabs" },
            template: "modules/darksheet/templates/Tab_DD.html",
            scrollable: [""]
        }
    };
}

// dnd5e 5.x prepares each ApplicationV2 sheet part before rendering it.
// The DD tab is registered as a real sheet part above; this hook only adds
// module-specific context that the DD template needs.
Hooks.on("dnd5e.prepareSheetContext", (sheet, partId, context) => {
    if (sheet?.document?.type !== "character") return;
    if (partId === "dd") {
        context.hidechecks = game.settings.get("darksheet", "hidechecks");
        context.globalRegMagic = game.settings.get("darksheet", "globalRegMagic");
        context.showTraining = game.settings.get("darksheet", "trainingSection");
        const tr = sheet.document.getFlag("darksheet", "training") || {};
        context.training = Array.from({ length: 10 }, (_, i) => ({ n: i + 1, checked: !!tr["box" + (i + 1)] }));
    }
    if (partId === "spells" || partId === "spellBurnout") {
        context.savecantrips = game.settings.get("darksheet", "savecantrips");
        context.globalRegMagic = game.settings.get("darksheet", "globalRegMagic");
    }
});

async function applySpellBurnoutToSheet(app, html, data) {
    const actor = app?.actor ?? data?.actor;
    if (!actor) return;

    const roots = [];
    if (html instanceof jQuery) roots.push(...html.toArray());
    else if (html instanceof HTMLElement) roots.push(html);

    if (app?.element instanceof HTMLElement) roots.push(app.element);
    else if (app?.element instanceof jQuery) roots.push(...app.element.toArray());
    else if (app?.element?.[0] instanceof HTMLElement) roots.push(app.element[0]);

    const uniqueRoots = [...new Set(roots.filter(Boolean))];
    const root = uniqueRoots.find(element => element?.querySelector?.("[data-application-part]")) ?? uniqueRoots[0];
    if (!root) return;

    const placeBurnout = async () => {
        const target = findSpellBurnoutTarget(root);
        if (!target) return false;

        if (target.querySelector(".darksheet-spell-burnout")) return true;

        let burnout = root.querySelector('[data-application-part="spellBurnout"] .darksheet-spell-burnout');
        if (!burnout) {
            const templateData = {
                ...data,
                actor,
                savecantrips: game.settings.get('darksheet', 'savecantrips'),
                globalRegMagic: game.settings.get('darksheet', 'globalRegMagic')
            };
            const spellBurnoutTemplate = await darksheetRenderTemplate("modules/darksheet/templates/spellburnout.html", templateData);
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = spellBurnoutTemplate;
            burnout = tempDiv.firstElementChild;
        }

        target.prepend(burnout);
        return true;
    };

    await placeBurnout();

    if (!root.dataset.darksheetSpellBurnoutObserver) {
        root.dataset.darksheetSpellBurnoutObserver = "true";
        root.querySelectorAll('[data-action="tab"][data-tab], .tabs [data-tab]').forEach(tab => {
            tab.addEventListener("click", () => setTimeout(placeBurnout, 0));
        });

        const observer = new MutationObserver(() => {
            if (root.querySelector('[data-application-part="spells"]')) placeBurnout();
        });
        observer.observe(root, { childList: true, subtree: true });
    }
}

function findSpellBurnoutTarget(root) {
    const selectors = [
        '.tab[data-tab="spells"] .top',
        '.tab[data-tab="spellbook"] .top',
        'section[data-application-part="spells"] .top',
        '.tab[data-tab="spells"]',
        '.tab[data-tab="spellbook"]',
        'section[data-application-part="spells"]',
        '.spells',
        '.spellbook'
    ];

    for (const selector of selectors) {
        const target = root.matches?.(selector) ? root : root.querySelector?.(selector);
        if (target) return target;
    }
    return null;
}

async function applyFatigueAndTemperatureAdditions(app, html, data) {
    let container = html.find(".main-content").find(".tab-body").find(".details").find(".right").find(".flexrow");

    let inventoryAdditionsTemplate = await darksheetRenderTemplate("modules/darksheet/templates/fatigue.html", data);

    // Convert the HTML string into DOM elements
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = inventoryAdditionsTemplate;
    container.append(tempDiv.children)
}

async function applyInventoryAdditions(app, html, data) {
    let inventoryContainer = html.find(".inventory-element");

    if (inventoryContainer.length > 0) {
        let inventoryAdditionsTemplate = await darksheetRenderTemplate("modules/darksheet/templates/inventoryAdditions.html", data);

        // Convert the HTML string into DOM elements
        let tempDiv = document.createElement("div");
        tempDiv.innerHTML = inventoryAdditionsTemplate;

        // Get the 4th child position (index 3, since it's zero-based)
        let children = inventoryContainer.children();
        if (children.length >= 2) {
            children.eq(2).after(tempDiv.children);
        } else {
            // If there are fewer than 4 children, append at the end
            inventoryContainer.append(tempDiv.children);
        }
    }
}

async function addStressBar(app, html, data) {
    // dnd5e 5.x V2 sheets pass a different prepared context - pull the actor
    // from the app and read flags via getFlag for safety against missing data.
    const actor = app?.actor ?? data?.actor;
    if (!actor) return;
    const dsFlags = actor.flags?.darksheet ?? {};
    const dsAttrs = dsFlags.attributes ?? {};
    let stressValue = dsAttrs.stress ?? 0;

    // Determine the next stress max threshold
    let stressMax = 20;
    if (stressValue >= 35) stressMax = 40;
    else if (stressValue >= 30) stressMax = 35;
    else if (stressValue >= 20) stressMax = 30;

    // Calculate the stress bar width as a percentage
    let stressBarWidth = (stressValue / stressMax) * 100;
    if (stressBarWidth > 100) stressBarWidth = 100; // Ensure it doesn't exceed 100%

    // Determine the color based on severity
    let stressColor = "#228B22"; // Deep Green (Safe)
    if (stressValue >= 10) stressColor = "#B8860B"; // Dark Yellow (Mild Stress)
    if (stressValue >= 20) stressColor = "#D2691E"; // Dark Orange (High Stress)
    if (stressValue >= 30) stressColor = "#8B0000"; // Red (Critical Stress)


    data.stressBarWidth = stressBarWidth;
    data.stressColor = stressColor;

    // Flags to determine which afflictions to show
    data.showAffliction1 = stressValue >= 20 || (dsAttrs.affliction1?.value !== undefined && dsAttrs.affliction1.value !== "default");
    data.showAffliction2 = stressValue >= 30 || (dsAttrs.affliction2?.value !== undefined && dsAttrs.affliction2.value !== "default");
    data.showAffliction3 = stressValue >= 35 || (dsAttrs.affliction3?.value !== undefined && dsAttrs.affliction3.value !== "default");
    data.showBreakingPoint = stressValue >= 40;
    // Inject computed values
    data.stressMax = stressMax;

    // Skip injection if the stress bar is already rendered (re-render of the
    // same sheet, or multiple matching hooks firing).
    if (html.find('.stress-bar, .stress-points').length === 0) {
        let meterGroup = html.find(".meter-group").eq(1);
        if (meterGroup.length > 0) {
            let stressBarTemplate = await darksheetRenderTemplate("modules/darksheet/templates/stressbar.html", data);
            meterGroup.append(stressBarTemplate);
        }
    }

    // **Get stress input & value span**
    let stressInput = html.find("#darkStressbar");
    let stressValueSpan = html.find(".darkStressValue");

    // **Clicking on meter hides span and focuses input**
    html.find(".stress-points").on("click", () => {
        stressValueSpan.hide();
        stressInput.show().focus();
    });

    // **Handle input blur (hide input, show span)**
    stressInput.on("blur", async (ev) => {
        let newValue = ev.target.value;
        let stressValue = parseInt(newValue, 10);
        if (!isNaN(stressValue)) {
            await app.actor.update({
                'flags.darksheet.attributes.stress': stressValue
            });
        }
        stressInput.hide();
        stressValueSpan.show();
    });

    // **Pressing Enter submits and hides input**
    stressInput.on("keypress", async (ev) => {
        if (ev.key === "Enter") {
            let newValue = ev.target.value;
            let stressValue = parseInt(newValue, 10);
            if (!isNaN(stressValue)) {
                await app.actor.update({
                    'flags.darksheet.attributes.stress': stressValue
                });
            }
            stressInput.hide();
            stressValueSpan.text(stressValue).show();
        }
    });

    // Hide input field initially
    stressInput.hide();
}



Hooks.on(`renderItemSheet5e2`, (app, html, data) => {
    if (!(html instanceof jQuery)) html = $(html);
    //Insert additional data
    loadItemData(app, html, data);
});
// dnd5e 5.x also fires renderItemSheet5e for the base item sheet - wire the same.
Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    if (!(html instanceof jQuery)) html = $(html);
    loadItemData(app, html, data);
});

Hooks.on("preCreateItem", (item) => {
    if (!darksheetSilverStandardEnabled()) return;
    darksheetDefaultItemPriceDenomination(item, { persist: false, includePriced: true, stepSilver: true });
});

// Don't let the socket count drop below the number of jewels already socketed.
Hooks.on("preUpdateItem", (item, changes) => {
    const raw = foundry.utils.getProperty(changes, "flags.darksheet.item.sockets");
    if (raw === undefined) return; // socket count not being changed
    const socketed = Array.isArray(item.flags?.darksheet?.sockets) ? item.flags.darksheet.sockets.length : 0;
    let effective = (raw === "" || raw == null) ? 3 : Number(raw);
    if (!Number.isFinite(effective)) return;
    if (effective > 5) effective = 5;
    if (effective < socketed) {
        foundry.utils.setProperty(changes, "flags.darksheet.item.sockets", socketed);
        ui.notifications.warn(`Darksheet | ${item.name} has ${socketed} socketed jewel(s) \u2014 remove some before lowering its socket count.`);
        return;
    }
    if (effective !== Number(raw)) foundry.utils.setProperty(changes, "flags.darksheet.item.sockets", effective);
});

// Show the same wear border/cracks on the dnd5e hover item tooltip.
Hooks.once("ready", () => {
    try {
        const proto = CONFIG.Item?.documentClass?.prototype;
        if (!proto || typeof proto.richTooltip !== "function" || proto._dsWearWrapped) return;
        proto._dsWearWrapped = true;
        const orig = proto.richTooltip;
        proto.richTooltip = async function (...args) {
            const result = await orig.apply(this, args);
            try {
                const wear = darksheetWearInfo(this);
                const extra = darksheetTooltipExtra(this);
                if (result && typeof result.content === "string") {
                    if (wear) result.content = result.content.replace(/<img\b[^>]*>/, m => `<span class="darkwear-wrap ${wear.classes.join(" ")}">${m}</span>`);
                    if (extra) result.content += extra;
                } else if (typeof result === "string") {
                    let html = result;
                    if (wear) html = html.replace(/<img\b[^>]*>/, m => `<span class="darkwear-wrap ${wear.classes.join(" ")}">${m}</span>`);
                    return html + extra;
                }
            } catch (e) { /* ignore */ }
            return result;
        };
    } catch (e) { console.warn("Darksheet | Could not wrap item tooltip for wear visuals.", e); }
});

function darksheetSilverStandardEnabled() {
    try {
        return !!game.settings.get("darksheet", "silverstandard");
    } catch {
        return false;
    }
}

function darksheetPriceIsBlankDefault(price) {
    if (price == null) return true;
    if (typeof price === "number") return price === 0;
    const value = Number(price.value ?? 0);
    return !Number.isFinite(value) || value === 0;
}

function darksheetPriceValue(price) {
    if (typeof price === "number") return price;
    const value = Number(price?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
}

function darksheetPriceDenomination(price) {
    if (!price || typeof price !== "object") return "";
    return String(price.denomination ?? price.currency ?? "").toLowerCase();
}

const DARKSHEET_QUALITY_VALUE_MULTIPLIER = {
    pristine: 0.75,
    worn: 0.5,
    "well-worn": 0.25,
    scarred: 0.1
};

function darksheetQualityKey(item) {
    const quality = item?.flags?.darksheet?.item?.quality;
    return DARKSHEET_QUALITY_VALUE_MULTIPLIER[quality] != null ? quality : "pristine";
}

function darksheetFormatPrice(value, denomination = "gp") {
    const rounded = Math.round(Number(value || 0) * 100) / 100;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `${text} ${denomination || "gp"}`;
}

function darksheetQualityValue(item) {
    const base = darksheetPriceValue(item?.system?.price);
    if (!base) return null;
    const denomination = darksheetPriceDenomination(item?.system?.price) || "gp";
    const quality = darksheetQualityKey(item);
    const multiplier = DARKSHEET_QUALITY_VALUE_MULTIPLIER[quality] ?? DARKSHEET_QUALITY_VALUE_MULTIPLIER.pristine;
    const adjusted = base * multiplier;
    const qualityName = darksheetCap(quality);
    const percent = Math.round(multiplier * 100);
    const adjustedLabel = darksheetFormatPrice(adjusted, denomination);
    const baseLabel = darksheetFormatPrice(base, denomination);
    return {
        quality,
        qualityName,
        multiplier,
        percent,
        adjusted,
        base,
        denomination,
        adjustedLabel,
        baseLabel,
        tooltip: `${qualityName} value: ${adjustedLabel} (${percent}% of ${baseLabel})`
    };
}

function darksheetApplyQualityValueToPriceElement(priceEl, item) {
    const qualityValue = darksheetQualityValue(item);
    if (!priceEl || !qualityValue) return;
    priceEl.textContent = qualityValue.adjustedLabel;
    priceEl.classList.add("darksheet-quality-price");
    priceEl.dataset.tooltip = qualityValue.tooltip;
    priceEl.title = qualityValue.tooltip;
}

function darksheetSilverStandardDenomination(denomination, { stepSilver = false } = {}) {
    const key = String(denomination || "gp").toLowerCase();
    if (key === "gp") return "sp";
    if (key === "sp") return stepSilver ? "cp" : "sp";
    return key || "sp";
}

async function darksheetDefaultItemPriceDenomination(item, { persist = true, includePriced = false, stepSilver = false } = {}) {
    if (!item || !darksheetSilverStandardEnabled()) return false;
    if (item.flags?.darksheet?.silverStandardApplied) return false;
    const price = item.system?.price;
    if (!includePriced && !darksheetPriceIsBlankDefault(price)) return false;
    const denomination = darksheetPriceDenomination(price);
    const nextDenomination = darksheetSilverStandardDenomination(denomination, { stepSilver });
    if (denomination && denomination === nextDenomination) return false;

    const update = typeof price === "object" && price !== null
        ? { "system.price.denomination": nextDenomination, "flags.darksheet.silverStandardApplied": true }
        : { "system.price": { value: Number(price ?? 0), denomination: nextDenomination }, "flags.darksheet.silverStandardApplied": true };

    if (!persist || item.parent == null) {
        item.updateSource?.(update);
        return true;
    }

    if (item.isOwner !== false) {
        try {
            await item.update(update, { render: false });
            return true;
        } catch (error) {
            console.warn(`Darksheet | Could not default item price denomination to ${nextDenomination}.`, error);
        }
    }
    return false;
}

function darksheetApplySilverStandardPriceControls(app, html) {
    if (!darksheetSilverStandardEnabled()) return;
    const item = app?.item ?? app?.document;
    if (item?.flags?.darksheet?.silverStandardApplied) return;
    const price = item?.system?.price;
    if (!darksheetPriceIsBlankDefault(price)) return;

    const roots = [];
    if (html instanceof jQuery) roots.push(...html.toArray());
    else if (html instanceof HTMLElement) roots.push(html);
    if (app?.element instanceof HTMLElement) roots.push(app.element);
    else if (app?.element instanceof jQuery) roots.push(...app.element.toArray());
    else if (app?.element?.[0] instanceof HTMLElement) roots.push(app.element[0]);

    for (const root of new Set(roots.filter(Boolean))) {
        const denomination = root.querySelector?.('[name="system.price.denomination"], [name="system.price.currency"]');
        if (!denomination) continue;
        const nextDenomination = darksheetSilverStandardDenomination(denomination.value);
        if (denomination.value !== nextDenomination && (!denomination.value || denomination.value === "gp" || denomination.value === "sp")) {
            denomination.value = nextDenomination;
            denomination.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }
}

const darksheetBurnoutMessageKeys = new Set();

function darksheetShouldAutoRollBurnout(actor, item) {
    if (!actor || !item || item.type !== "spell") return false;
    if (!actor.flags?.darksheet?.attributes?.autmomaticburnout) return false;
    const burnoutDie = Number(actor.flags?.darksheet?.attributes?.burnout?.value ?? 0);
    if (!Number.isFinite(burnoutDie) || burnoutDie <= 0) return false;
    const isCantrip = Number(item.system?.level ?? item.system?.spellLevel ?? 0) === 0;
    return !isCantrip || !game.settings.get('darksheet', 'savecantrips');
}

function darksheetBurnoutKey(actor, item, seed = "") {
    return [actor?.uuid ?? actor?.id ?? "", item?.uuid ?? item?.id ?? "", seed].join("|");
}

async function darksheetTriggerAutoBurnout(actor, item, seed = "") {
    if (!darksheetShouldAutoRollBurnout(actor, item)) return false;
    const key = darksheetBurnoutKey(actor, item, seed);
    if (darksheetBurnoutMessageKeys.has(key)) return false;
    darksheetBurnoutMessageKeys.add(key);
    setTimeout(() => darksheetBurnoutMessageKeys.delete(key), 3000);
    await rollBurnout(actor);
    return true;
}

function darksheetResolveActorFromMessage(message, data = {}) {
    const associated = message?.getAssociatedActor?.();
    if (associated) return associated;
    const speaker = message?.speaker ?? data?.speaker ?? {};
    if (speaker.scene && speaker.token) {
        const token = game.scenes.get(speaker.scene)?.tokens.get(speaker.token);
        if (token?.actor) return token.actor;
    }
    return game.actors.get(speaker.actor);
}

function darksheetResolveItemFromMessage(message, actor, data = {}) {
    const associated = message?.getAssociatedItem?.();
    if (associated) return associated;
    const flags = message?.flags?.dnd5e ?? data?.flags?.dnd5e ?? {};
    const itemUuid = flags.item?.uuid ?? flags.use?.itemUuid;
    const itemFromUuid = itemUuid ? fromUuidSync(itemUuid, { strict: false }) : null;
    if (itemFromUuid) return itemFromUuid;
    const itemId = flags.item?.id ?? flags.use?.itemId;
    return itemId ? actor?.items?.get(itemId) : null;
}

Hooks.on("dnd5e.postUseActivity", async (activity, usageConfig, results) => {
    const item = activity?.item;
    const actor = results?.message?.getAssociatedActor?.() ?? item?.actor ?? activity?.actor;
    if (!darksheetShouldAutoRollBurnout(actor, item)) return;
    const messageId = results?.message?.id ?? results?.message?.uuid ?? `${Date.now()}`;
    await darksheetTriggerAutoBurnout(actor, item, messageId);
});

Hooks.on('preCreateChatMessage', async (message, data, options, userId) => {
    if (userId !== game.user.id) return;
    const flags = message?.flags?.dnd5e ?? data?.flags?.dnd5e ?? {};
    if (flags.activity) return; // Modern dnd5e activity usage is handled by dnd5e.postUseActivity.
    const isDnd5eUsage = message?.type === "usage"
        || data?.type === "usage"
        || flags.messageType === "usage"
        || !!flags.item
        || !!flags.use;
    if (!isDnd5eUsage) return;

    const actor = darksheetResolveActorFromMessage(message, data);
    const item = darksheetResolveItemFromMessage(message, actor, data);
    const seed = message?.id ?? message?._id ?? data?._id ?? flags.activity?.uuid ?? flags.activity?.id ?? "";
    await darksheetTriggerAutoBurnout(actor, item, seed);
});

// Element / gem -> pip colour for the socket display.
const DARKSHEET_ELEMENTAL_GEMS = {
    Alexandrite: "thunder", Amethyst: "psychic", Aquamarine: "force", Diamond: "radiant",
    Emerald: "poison", Onyx: "necrotic", Peridot: "acid", Ruby: "fire", Sapphire: "cold", Topaz: "lightning"
};
const DARKSHEET_ELEMENT_COLOR = {
    fire: "#ff6b3d", cold: "#7fd6ff", lightning: "#ffe14d", thunder: "#b8b8c8", acid: "#9bdb3a",
    poison: "#7ec850", radiant: "#ffe9a3", necrotic: "#8a6fb0", force: "#c08bff", psychic: "#ff7bd5"
};
const DARKSHEET_GEM_COLOR = {
    Garnet: "#b5343a", Ruby: "#e23b3b", Jasper: "#c66a4a", Opal: "#cfe7e0", Pearl: "#ede6d6",
    Jet: "#8a78a0", Quartz: "#e7d24a", Onyx: "#7d7890", Sapphire: "#3f7be0", Amethyst: "#b07ad6",
    Topaz: "#e0b24a", Aquamarine: "#5bd6c4", Alexandrite: "#7ac06a", Diamond: "#dfe9ff",
    Emerald: "#3fb56a", Peridot: "#b6db4a"
};
function darksheetSocketColor(socket) {
    const element = socket?.element || DARKSHEET_ELEMENTAL_GEMS[socket?.gem];
    if (element && DARKSHEET_ELEMENT_COLOR[element]) return DARKSHEET_ELEMENT_COLOR[element];
    return DARKSHEET_GEM_COLOR[socket?.gem] || "#d8ae58";
}
// Items that require attunement carry their power in the attunement itself, so
// they get NO default jewel sockets; only what the GM explicitly grants.
function dsRequiresAttunement(item) { return item?.system?.attunement === "required"; }
// The default socket count when the GM hasn't set one: 0 for attunement items, 3 otherwise.
function dsDefaultSockets(item) { return dsRequiresAttunement(item) ? 0 : 3; }
function darksheetSocketDisplay(item) {
    if (!item || (item.type !== "weapon" && item.type !== "equipment")) return null;
    const fl = item.flags?.darksheet || {};
    const raw = fl.item?.sockets;
    const count = (raw === "" || raw == null) ? dsDefaultSockets(item) : Math.min(5, Math.max(0, Math.round(Number(raw) || 0)));
    const socketed = Array.isArray(fl.sockets) ? fl.sockets : [];
    if (count <= 0 && !socketed.length) return null;
    const total = Math.max(count, socketed.length);
    const slots = [];
    for (let i = 0; i < total; i++) {
        const s = socketed[i];
        if (s) slots.push({ filled: true, color: darksheetSocketColor(s), label: `${s.name}${s.effect ? " \u2014 " + s.effect : ""}` });
        else slots.push({ filled: false, label: "Empty socket" });
    }
    return { slots, used: socketed.length, max: total };
}

// What each temper does (shown on hover over the temper tag / sheet field).
const DARKSHEET_TEMPER_INFO = {
    Pure: { short: "cost \u00D72, value \u00D73", full: "Pure temper \u2014 crafting cost \u00D72, value \u00D73 (3 days). Critical failures deal only \u00BD a notch of damage." },
    Royal: { short: "cost \u00D74, value \u00D76", full: "Royal temper \u2014 crafting cost \u00D74, value \u00D76 (1 week). Critical failures deal only \u00BC of a notch." },
    Astral: { short: "cost \u00D78, value \u00D712", full: "Astral temper \u2014 crafting cost \u00D78, value \u00D712 (2 weeks). Critical failures deal only \u215B of a notch." }
};
const DARKSHEET_QUALITY_INFO = {
    worn: "Worn \u2014 lightly used; resale value reduced.",
    "well-worn": "Well-Worn \u2014 visibly used; resale value notably reduced.",
    scarred: "Scarred \u2014 heavily damaged; resale value greatly reduced."
};
function darksheetCap(s) { return String(s || "").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-"); }
// Build the Darker Dungeons info block appended to an item's hover tooltip.
function darksheetTooltipExtra(item) {
    const d = item?.flags?.darksheet?.item || {};
    const rows = [];
    if (d.quality && d.quality !== "pristine") rows.push(DARKSHEET_QUALITY_INFO[d.quality] || `Condition: ${darksheetCap(d.quality)}`);
    const notches = Number(d.notches) || 0;
    const frag = d.fragility;
    if (notches > 0) rows.push(`Notches: ${notches}${frag ? ` of ${frag} before it shatters` : ""}.`);
    else if (frag) rows.push(`Fragility: shatters after ${frag} notches.`);
    if (d.temper && DARKSHEET_TEMPER_INFO[d.temper]) rows.push(DARKSHEET_TEMPER_INFO[d.temper].full);
    if (d.ammodie) rows.push(`Ammo die: ${d.ammodie} (depletes as you fire).`);
    if (item?.type === "weapon" || item?.type === "equipment") {
        const sockets = Array.isArray(item.flags?.darksheet?.sockets) ? item.flags.darksheet.sockets : [];
        const max = dsItemSocketMax(item);
        if (max > 0 || sockets.length) {
            const names = sockets.map(s => s.name).join(", ");
            rows.push(`Arcane sockets: ${sockets.length}/${max}${names ? ` \u2014 ${names}` : ""}.`);
        }
    }
    if (!rows.length) return "";
    return `<section class="darksheet-tooltip-extra"><p class="dd-head"><i class="fas fa-skull"></i> Darker Dungeons</p>${rows.map(r => `<p>${r}</p>`).join("")}</section>`;
}

// Wear visuals: classes to put on an item's icon for the configured display mode.
function darksheetWearInfo(item) {
    const q = item?.flags?.darksheet?.item?.quality;
    if (!q || q === "pristine") return null;
    let mode = "tag";
    try { mode = game.settings.get("darksheet", "wearDisplay"); } catch (e) {}
    if (mode === "tag") return null;
    const classes = ["darkwear", "darkwear-q-" + q];
    if (mode === "cracks") classes.push("darkwear-cracks");
    const label = q.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("-");
    return { quality: q, mode, classes, label };
}
// Wrap an icon element in a span carrying the wear classes (so the border +
// ::after cracks render). Works for <img> AND dnd5e's <dnd5e-icon> custom
// element; the latter is `display:contents` (no box of its own), so adding
// classes directly to it would render nothing; a wrapper gives us a real box.
function darksheetWearWrapImg(icon, info) {
    if (!icon || !info) return;
    let wrap = icon.parentElement;
    if (!wrap?.classList?.contains("darkwear-wrap")) {
        wrap = document.createElement("span");
        icon.parentElement?.insertBefore(wrap, icon);
        wrap.appendChild(icon);
    }
    wrap.className = "darkwear-wrap " + info.classes.join(" ");
    wrap.dataset.tooltip = info.label;
}
// Apply wear visuals to an icon element. Always wrap so it works regardless of
// whether the icon is an <img>, a <dnd5e-icon>, or a background <div>.
function darksheetApplyWearTo(el, info) {
    if (!el || !info) return;
    darksheetWearWrapImg(el, info);
}

// Inject socket pips next to an inventory row's item name (idempotent).
function darksheetInjectRowSockets(itemEl, item) {
    try {
        const sd = darksheetSocketDisplay(item);
        if (!sd) return;
        const nameEl = itemEl.getElementsByClassName("title")[0]
            || itemEl.querySelector(".item-name .title")
            || itemEl.querySelector(".item-name")
            || itemEl.querySelector("[class*='name']");
        if (!nameEl || nameEl.querySelector(".darksheet-row-sockets")) return;
        const wrap = document.createElement("span");
        wrap.className = "darksheet-row-sockets";
        for (const slot of sd.slots) {
            const pip = document.createElement("span");
            pip.className = "darksheet-socket darksheet-row-socket " + (slot.filled ? "is-filled" : "is-empty");
            pip.dataset.tooltip = slot.label || (slot.filled ? "Socketed jewel" : "Empty socket");
            if (slot.filled) pip.innerHTML = `<i class="fa-solid fa-gem" style="color:${slot.color}"></i>`;
            wrap.append(pip);
        }
        nameEl.append(wrap);
    } catch (e) { /* sheet markup varies; ignore */ }
}

// ===== Socketing engine (item-sheet clickable sockets) =====
const DS_SOCKET_TOOL_PATTERNS = { tinker: /tinker/i, jeweler: /jewel/i, smith: /smith/i, leather: /leather/i, weaver: /weav/i, wood: /wood|carv/i };
const DS_UNSOCKET_DC = { Royal: 10, Lucent: 15, Astral: 20 };
const DS_ELEMENTS = ["fire", "cold", "lightning", "thunder", "acid", "poison", "radiant", "necrotic", "force", "psychic"];
function dsDetectElement(text) {
    if (!text) return "";
    const t = String(text).toLowerCase();
    return DS_ELEMENTS.find(e => new RegExp("\\b" + e + "\\b").test(t)) || "";
}
function dsResolveElement(text, element) {
    if (!element || !text) return text;
    return String(text).replace(/your gemstone'?s elemental damage type/gi, `${element} damage`).replace(/your gemstone'?s element/gi, element).replace(/\{el\}/g, element);
}
function dsIsJewel(item) { return !!(item?.flags?.darksheet?.jewel?.base); }
function dsJewelInfo(jewelItem) {
    const f = jewelItem?.flags?.darksheet?.jewel;
    if (!f || !f.base) return null;
    const element = f.element || DARKSHEET_ELEMENTAL_GEMS[f.gem] || dsDetectElement(f.effect) || dsDetectElement(jewelItem.system?.description?.value) || "";
    const needsElement = f.gem === "Elemental" && !element;
    return { base: f.base, tier: f.tier || "", slot: f.slot || "", gem: f.gem || "", element, detail: f.detail || null, effectRaw: f.effect || "", needsElement, effect: dsResolveElement(f.effect || "", element || "your gemstone's element") };
}
function dsItemSocketKind(item) {
    if (item?.type === "weapon") return "weapon";
    if (item?.type === "equipment" && ["light", "medium", "heavy"].includes(item.system?.type?.value)) return "armor";
    return null;
}
function dsItemSocketMax(item) {
    const raw = item?.flags?.darksheet?.item?.sockets;
    if (raw === "" || raw == null) return dsDefaultSockets(item);
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(5, Math.max(0, Math.round(n))) : dsDefaultSockets(item);
}
function dsItemMagical(item) {
    const p = item?.system?.properties;
    if (p?.has) return p.has("mgc");
    if (Array.isArray(p)) return p.includes("mgc");
    return false;
}
function dsSockets(item) { const s = item?.flags?.darksheet?.sockets; return Array.isArray(s) ? s : []; }
function dsAcceptableTools(item) {
    if (item?.type === "weapon") return ["tinker", "jeweler", "smith", "wood"];
    const t = item?.system?.type?.value;
    if (t === "light") return ["tinker", "jeweler", "leather", "weaver"];
    if (t === "medium") return ["tinker", "jeweler", "smith", "leather"];
    if (t === "heavy") return ["tinker", "jeweler", "smith"];
    if (t === "shield") return ["tinker", "jeweler", "smith", "wood"];
    return ["tinker", "jeweler"];
}
function dsToolProficient(actor, item) {
    const tools = actor?.system?.tools || {};
    const profs = Object.entries(tools).filter(([, t]) => Number(t?.value ?? 0) >= 1).map(([k]) => k.toLowerCase());
    return dsAcceptableTools(item).some(k => profs.some(p => DS_SOCKET_TOOL_PATTERNS[k].test(p)));
}
function dsStripSocketBlock(html) {
    return String(html ?? "").replace(/<!--ds-sockets-->[\s\S]*?<!--\/ds-sockets-->/g, "").replace(/<section[^>]*class="ds-sockets-block"[\s\S]*?<\/section>/g, "").trim();
}
function dsSocketBlockHtml(item, sockets) {
    const rows = sockets.map(s => { const tag = s.element || (s.gem && s.gem !== "Elemental" ? s.gem : ""); return `<li><strong>${escapeSheetHtml(s.name)}</strong>${tag ? ` <em>(${escapeSheetHtml(tag)})</em>` : ""}: ${escapeSheetHtml(s.effect || "")}</li>`; }).join("");
    return `<section class="ds-sockets-block"><hr><p><strong>Arcane Sockets (${sockets.length}/${dsItemSocketMax(item)})</strong> \u2014 effects apply only while attuned.</p><ul>${rows}</ul></section>`;
}
async function dsWriteSockets(item, sockets) {
    const storedBase = item.flags?.darksheet?.socketBaseDesc;
    if (!sockets.length) {
        const restore = storedBase != null ? storedBase : dsStripSocketBlock(item.system?.description?.value);
        await item.update({ "flags.darksheet.sockets": [], "flags.darksheet.socketBaseDesc": null, "system.description.value": restore });
    } else {
        const base = storedBase != null ? storedBase : dsStripSocketBlock(item.system?.description?.value);
        await item.update({ "flags.darksheet.sockets": sockets, "flags.darksheet.socketBaseDesc": base, "system.description.value": base + dsSocketBlockHtml(item, sockets) });
    }
    await darksheetSyncSocketEffects(item);
}

// Translate the automatable passive jewels into Active Effect changes.
function darksheetSocketAE(s) {
    const TIERVAL = { Royal: 1, Lucent: 2, Astral: 3 };
    const v = TIERVAL[s.tier] || 1;
    const ADD = CONST.ACTIVE_EFFECT_MODES.ADD;
    let changes = null;
    switch (s.base) {
        case "Jewel of Resilience": changes = [{ key: "system.attributes.ac.bonus", mode: ADD, value: `+${v}`, priority: 20 }]; break;
        case "Jewel of Absorption": // RAW: flat reduce nonmagical b/p/s by 1/2/3 (magic weapons bypass)
            changes = ["bludgeoning", "piercing", "slashing"].map(t => ({ key: `system.traits.dm.amount.${t}`, mode: ADD, value: `+${v}`, priority: 20 }));
            changes.push({ key: "system.traits.dm.bypasses", mode: ADD, value: "mgc", priority: 20 });
            break;
        case "Jewel of Safety": if (s.detail?.key) changes = [{ key: `system.abilities.${s.detail.key}.bonuses.save`, mode: ADD, value: `+${v}`, priority: 20 }]; break;
        case "Jewel of Skill": if (s.detail?.key) changes = [{ key: `system.skills.${s.detail.key}.bonuses.check`, mode: ADD, value: `+${v}`, priority: 20 }]; break;
        case "Jewel of Resistance": if (s.element) changes = [{ key: "system.traits.dr.value", mode: ADD, value: s.element, priority: 20 }]; break;
        case "Jewel of Accuracy": changes = [{ key: "system.bonuses.mwak.attack", mode: ADD, value: `+${v}`, priority: 20 }, { key: "system.bonuses.rwak.attack", mode: ADD, value: `+${v}`, priority: 20 }]; break;
        case "Jewel of Damage": changes = [{ key: "system.bonuses.mwak.damage", mode: ADD, value: `+${v}`, priority: 20 }, { key: "system.bonuses.rwak.damage", mode: ADD, value: `+${v}`, priority: 20 }]; break;
    }
    if (!changes) return null;
    return { name: s.name, img: s.img, icon: s.img, transfer: true, disabled: false, changes, flags: { darksheet: { socketEffect: true } } };
}
// Rebuild the host item's socket Active Effects to match its current sockets.
async function darksheetSyncSocketEffects(item) {
    try {
        if (!item?.effects) return;
        const sockets = Array.isArray(item.flags?.darksheet?.sockets) ? item.flags.darksheet.sockets : [];
        const old = item.effects.filter(e => e.flags?.darksheet?.socketEffect).map(e => e.id);
        if (old.length) await item.deleteEmbeddedDocuments("ActiveEffect", old);
        const create = sockets.map(darksheetSocketAE).filter(Boolean);
        if (create.length) await item.createEmbeddedDocuments("ActiveEffect", create);
    } catch (e) { console.warn("Darksheet | Socket effect sync failed.", e); }
}
async function dsReturnJewel(actor, s) {
    const pack = game.packs.get("darksheet.darkitems");
    if (pack) {
        const idx = await pack.getIndex();
        const e = idx.find(x => x.name === s.name);
        if (e) { const doc = await pack.getDocument(e._id); const d = doc.toObject(); delete d._id; await actor.createEmbeddedDocuments("Item", [d]); return; }
    }
    await actor.createEmbeddedDocuments("Item", [{ name: s.name, type: "equipment", img: s.img, system: { type: { value: "trinket" }, rarity: "uncommon", quantity: 1 }, flags: { darksheet: { jewel: { base: s.base, tier: s.tier, slot: s.slot, gem: s.gem, element: s.element || "", effect: s.effect } } } }]);
}
function dsPromptElement(jewelName) {
    const els = ["fire", "cold", "lightning", "thunder", "acid", "poison", "radiant", "necrotic", "force", "psychic"];
    const opts = els.map(e => `<option value="${e}">${e[0].toUpperCase() + e.slice(1)}</option>`).join("");
    return new Promise(resolve => {
        new Dialog({
            title: `Choose Element: ${jewelName}`,
            content: `<form><div class="form-group"><label>Elemental damage type</label><select name="el" style="width:100%">${opts}</select></div></form>`,
            buttons: { ok: { label: "Confirm", callback: h => resolve(h[0].querySelector("select[name=el]").value) }, cancel: { label: "Cancel", callback: () => resolve(null) } },
            default: "ok", close: () => resolve(null)
        }).render(true);
    });
}
async function dsSocketChat(actor, item, body) {
    if (!actor) return;
    try { await Darksheet.postDarkscreenChat({ actor, title: "Socketing", icon: "fa-gem", whisper: "gm", body }); } catch (e) {}
}
function dsOnSocketClick(item, index) {
    const s = dsSockets(item)[index];
    if (s) dsOpenRemoveDialog(item, index, s);
    else dsOpenSlotDialog(item, index);
}
function dsOpenRemoveDialog(item, index, s) {
    const dc = DS_UNSOCKET_DC[s.tier] || 10;
    new Dialog({
        title: `Socketed: ${s.name}`,
        content: `<p>${escapeSheetHtml(s.effect || "")}</p><p><strong>Unsocket</strong> \u2014 8 hours + an Intelligence (Arcana) check vs DC ${dc}: success returns the reusable jewel, failure shatters it.<br><strong>Shatter</strong> \u2014 1 hour, the jewel is destroyed.</p>`,
        buttons: {
            unsocket: { icon: '<i class="fas fa-screwdriver-wrench"></i>', label: "Unsocket (roll)", callback: () => dsDoUnsocket(item, index) },
            shatter: { icon: '<i class="fas fa-gem"></i>', label: "Shatter", callback: () => dsDoShatter(item, index) },
            cancel: { label: "Cancel" }
        },
        default: "cancel"
    }).render(true);
}
async function dsDoShatter(item, index) {
    const sockets = dsSockets(item);
    const s = sockets[index];
    if (!s) return;
    await dsWriteSockets(item, sockets.filter((_, i) => i !== index));
    ui.notifications.info(`Darksheet | Shattered ${s.name} out of ${item.name}.`);
    dsSocketChat(item.parent, item, `<p><strong>${escapeSheetHtml(item.parent?.name ?? "")}</strong> shatters <strong>${escapeSheetHtml(s.name)}</strong> out of ${escapeSheetHtml(item.name)} \u2014 the jewel is destroyed.</p>`);
}
async function dsDoUnsocket(item, index) {
    const sockets = dsSockets(item);
    const s = sockets[index];
    if (!s) return;
    const actor = item.parent;
    const dc = DS_UNSOCKET_DC[s.tier] || 10;
    let success = true, roll = null;
    if (actor && !game.user.isGM) {
        if (!dsToolProficient(actor, item)) return ui.notifications.warn(`Darksheet | The owner needs proficiency with suitable tools to unsocket.`);
    }
    if (actor) {
        try { roll = await actor.rollSkill({ skill: "arc", target: dc }); } catch (e) { roll = null; }
        if (Array.isArray(roll)) roll = roll[0];
        if (roll) success = roll.total >= dc;
    }
    await dsWriteSockets(item, sockets.filter((_, i) => i !== index));
    if (success) {
        if (actor) await dsReturnJewel(actor, s);
        ui.notifications.info(`Darksheet | Unsocketed ${s.name} (returned).`);
        dsSocketChat(actor, item, `<p><strong>${escapeSheetHtml(actor?.name ?? "")}</strong> removes <strong>${escapeSheetHtml(s.name)}</strong> from ${escapeSheetHtml(item.name)}${roll ? ` \u2014 ${roll.total} vs DC ${dc}` : ""}. The jewel can be reused.</p>`);
    } else {
        ui.notifications.warn(`Darksheet | The jewel shattered while unsocketing (${roll?.total} vs DC ${dc}).`);
        dsSocketChat(actor, item, `<p><strong>${escapeSheetHtml(actor?.name ?? "")}</strong> fails to pry <strong>${escapeSheetHtml(s.name)}</strong> from ${escapeSheetHtml(item.name)} \u2014 ${roll?.total} vs DC ${dc}. The jewel <strong>shatters</strong>.</p>`);
    }
}
function dsOpenSlotDialog(item, index) {
    const actor = item.parent;
    if (!actor || actor.documentName !== "Actor") return ui.notifications.warn("Darksheet | Socket from a character's item so its jewels can be used.");
    const kind = dsItemSocketKind(item);
    const sockets = dsSockets(item);
    const max = dsItemSocketMax(item);
    const gm = game.user.isGM;
    if (!gm) {
        if (!kind) return ui.notifications.warn("Darksheet | Only weapons or light/medium/heavy armor can be socketed.");
        if (dsItemMagical(item)) return ui.notifications.warn("Darksheet | This item is enchanted/magical \u2014 enchantments OR sockets, not both.");
        if (sockets.length >= max) return ui.notifications.warn("Darksheet | No free sockets remain.");
        if (!dsToolProficient(actor, item)) return ui.notifications.warn("Darksheet | The owner needs proficiency with suitable tools to socket.");
    }
    const usedBases = new Set(sockets.map(s => s.base));
    const jewels = actor.items.filter(dsIsJewel).map(it => ({ it, info: dsJewelInfo(it) }))
        .filter(j => j.info && !usedBases.has(j.info.base) && (gm || !j.info.slot || !kind || j.info.slot.toLowerCase() === kind))
        .sort((a, b) => a.it.name.localeCompare(b.it.name));
    if (!jewels.length) return ui.notifications.warn("Darksheet | No valid jewels to socket (need a matching, not-yet-socketed jewel).");
    const opts = jewels.map(({ it, info }) => `<option value="${it.id}">${escapeSheetHtml(it.name)}${info.slot ? ` (${info.slot})` : ""}</option>`).join("");
    const effMap = Object.fromEntries(jewels.map(({ it, info }) => [it.id, info.effect || ""]));
    new Dialog({
        title: `Socket a Jewel: ${item.name}`,
        content: `<form><div class="form-group"><label>Jewel</label><select name="jid" style="width:100%">${opts}</select></div><div class="ds-jewel-effect" style="margin-top:6px;padding:6px 8px;border-radius:4px;background:rgba(0,0,0,0.18);font-size:12px;line-height:1.35;min-height:1.2em;"></div></form>`,
        buttons: { ok: { icon: '<i class="fas fa-gem"></i>', label: "Socket", callback: h => dsDoSocket(item, h[0].querySelector("select[name=jid]").value) }, cancel: { label: "Cancel" } },
        default: "ok",
        render: (h) => {
            const root = h[0] ?? h;
            const sel = root.querySelector("select[name=jid]");
            const box = root.querySelector(".ds-jewel-effect");
            if (!sel || !box) return;
            const upd = () => { box.textContent = effMap[sel.value] || "No description."; };
            sel.addEventListener("change", upd);
            upd();
        }
    }).render(true);
}
async function dsDoSocket(item, jewelId) {
    const actor = item.parent;
    const jewelItem = actor?.items.get(jewelId);
    if (!jewelItem) return;
    const info = dsJewelInfo(jewelItem);
    if (!info) return ui.notifications.warn("Darksheet | That isn't a recognised arcane jewel.");
    const kind = dsItemSocketKind(item);
    const sockets = dsSockets(item);
    const max = dsItemSocketMax(item);
    const gm = game.user.isGM;
    if (!gm) {
        if (sockets.length >= max) return ui.notifications.warn("Darksheet | No free sockets remain.");
        if (info.slot && kind && info.slot.toLowerCase() !== kind) return ui.notifications.warn(`Darksheet | A ${info.slot} jewel can't go in ${kind} gear.`);
        if (sockets.some(s => s.base === info.base)) return ui.notifications.warn("Darksheet | That jewel type is already socketed here.");
    }
    const element = info.element, effect = info.effect;
    const qty = Number(jewelItem.system?.quantity ?? 1);
    if (qty > 1) await jewelItem.update({ "system.quantity": qty - 1 });
    else await jewelItem.delete();
    const next = [...sockets, { base: info.base, tier: info.tier, slot: info.slot, gem: info.gem, element: element || "", detail: info.detail || null, name: jewelItem.name, img: jewelItem.img, effect }];
    await dsWriteSockets(item, next);
    ui.notifications.info(`Darksheet | Socketed ${jewelItem.name} into ${item.name}.`);
    dsSocketChat(actor, item, `<p><strong>${escapeSheetHtml(actor?.name ?? "")}</strong> sockets <strong>${escapeSheetHtml(jewelItem.name)}</strong> into ${escapeSheetHtml(item.name)} (${next.length}/${max}).</p>`);
}
function wireItemSocketClicks(app, item) {
    const el = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? null);
    if (!el) return;
    el.querySelectorAll(".darksheet-item-data .ds-socket-click").forEach(node => {
        node.addEventListener("click", ev => { ev.preventDefault(); dsOnSocketClick(item, Number(node.dataset.socketIndex)); });
    });
}

/* =====
 Gemcutting / Jewelcrafting - shared actions usable from the item
 sheet and inventory rows. Mirrors the Darkscreen workshop logic so
 gems can be cut/ground/crafted without opening the screen.
 ===== */
const DSGEM = {
    CRAFT_TIERS: ["Royal", "Lucent", "Astral"],
    TIER_LETTER: { Royal: "R", Lucent: "L", Astral: "A" },
    GEM_CRAFT_DC: { Royal: 15, Lucent: 20, Astral: 25 },
    ARCANE_DUST_IMG: "icons/commodities/materials/bowl-powder-blue.webp",
    ELEMENTAL_GEMS: {
        Alexandrite: "thunder", Amethyst: "psychic", Aquamarine: "force",
        Diamond: "radiant", Emerald: "poison", Onyx: "necrotic",
        Peridot: "acid", Ruby: "fire", Sapphire: "cold", Topaz: "lightning"
    },
    OIL_BY_GEM: {
        Diamond: "Oil of Blessing", Emerald: "Oil of Blight", Onyx: "Oil of Destruction",
        Topaz: "Oil of Energy", Ruby: "Oil of Flameheart", Amethyst: "Oil of Frenzy",
        Sapphire: "Oil of Ice", Aquamarine: "Oil of Spellshock", Peridot: "Oil of Spite",
        Alexandrite: "Oil of Storms"
    },
    QUALITY_LADDER: [
        { q: "Cloudy", uncut: 2, cut: 10, dc: 15 },
        { q: "Clear", uncut: 10, cut: 50, dc: 15 },
        { q: "Pristine", uncut: 20, cut: 100, dc: 20 },
        { q: "Royal", uncut: 100, cut: 500, dc: 20 },
        { q: "Lucent", uncut: 200, cut: 1000, dc: 25 },
        { q: "Astral", uncut: 1000, cut: 5000, dc: 25 }
    ],
    JEWEL_RECIPES: [
        { base: "Jewel of Absorption", slot: "Armor", gem: "Garnet", tiers: "RLA", effect: "Reduce the nonmagical damage you take by 1/2/3." },
        { base: "Jewel of Capacity", slot: "Armor", gem: "Opal", tiers: "LA", effect: "Count as one size category larger for carrying capacity (and, at Astral, for the weight you can push, drag, or lift)." },
        { base: "Jewel of Grounding", slot: "Armor", gem: "Opal", tiers: "LA", effect: "Spend your reaction to reduce the distance you are forcibly moved by 5/10 ft." },
        { base: "Jewel of Luck", slot: "Armor", gem: "Pearl", tiers: "RLA", effect: "Spend a charge to reroll a d20 (ability check, attack, or save). Charges: 1/2/3." },
        { base: "Jewel of Resilience", slot: "Armor", gem: "Garnet", tiers: "RLA", effect: "Gain a +1/+2/+3 bonus to AC." },
        { base: "Jewel of Resistance", slot: "Armor", gem: "Elemental", tiers: "L", effect: "Gain resistance to {el} damage." },
        { base: "Jewel of Safety", slot: "Armor", gem: "Jasper", tiers: "RLA", effect: "Gain a +1/+2/+3 bonus to one chosen saving throw." },
        { base: "Jewel of Skill", slot: "Armor", gem: "Pearl", tiers: "RLA", effect: "Gain a +1/+2/+3 bonus to one chosen skill." },
        { base: "Jewel of Speed", slot: "Armor", gem: "Jet", tiers: "RLA", effect: "Spend a charge (bonus action) for a +5/+10/+15 ft bonus to your speed for 10 minutes. Charges: 3." },
        { base: "Jewel of Spellbinding", slot: "Armor", gem: "Quartz", tiers: "RLA", effect: "Spend a charge to cast a stored 1st/2nd/3rd-level spell. Charges: 1." },
        { base: "Jewel of Spellpower", slot: "Armor", gem: "Quartz", tiers: "RLA", effect: "Spend a charge to recover one expended 1st/2nd/3rd-level spell slot. Charges: 1." },
        { base: "Jewel of Vigor", slot: "Armor", gem: "Jet", tiers: "RLA", effect: "Spend a charge to recover 1/2/3 expended hit dice. Charges: 1." },
        { base: "Jewel of Accuracy", slot: "Weapon", gem: "Pearl", tiers: "RLA", effect: "Gain a +1/+2/+3 bonus to attack rolls." },
        { base: "Jewel of Bane", slot: "Weapon", gem: "Emerald", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 poison damage and poison the target (save ends). Charges: 3." },
        { base: "Jewel of Blinding", slot: "Weapon", gem: "Diamond", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 radiant damage and blind the target until the end of its next turn. Charges: 3." },
        { base: "Jewel of Corrosion", slot: "Weapon", gem: "Peridot", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 acid damage and reduce the target's AC by 1. Charges: 3." },
        { base: "Jewel of Damage", slot: "Weapon", gem: "Garnet", tiers: "RLA", effect: "Gain a +1/+2/+3 bonus to damage rolls." },
        { base: "Jewel of Decay", slot: "Weapon", gem: "Onyx", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 necrotic damage; disintegrate the slain. Charges: 3." },
        { base: "Jewel of Elements", slot: "Weapon", gem: "Elemental", tiers: "RLA", effect: "Deal an additional +1d6/1d8/1d10 {el} damage on a hit (passive, no charges)." },
        { base: "Jewel of Frost", slot: "Weapon", gem: "Sapphire", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 cold damage and freeze the target in place. Charges: 3." },
        { base: "Jewel of Immolation", slot: "Weapon", gem: "Ruby", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 fire damage and set ongoing flames. Charges: 3." },
        { base: "Jewel of Opportunity", slot: "Weapon", gem: "Jet", tiers: "L", effect: "Spend a charge to make an opportunity attack as a free action. Charges: 3." },
        { base: "Jewel of Nightmares", slot: "Weapon", gem: "Amethyst", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 psychic damage and frighten the target of you. Charges: 3." },
        { base: "Jewel of Piercing", slot: "Weapon", gem: "Elemental", tiers: "A", effect: "Ignore resistance to {el} damage; treat a target's {el} immunity as resistance instead." },
        { base: "Jewel of Reach", slot: "Weapon", gem: "Pearl", tiers: "LA", effect: "Spend a charge to extend your weapon's natural range by +5/+10 ft until the end of your turn. Charges: 3." },
        { base: "Jewel of Recovery", slot: "Weapon", gem: "Quartz", tiers: "L", effect: "Spend a charge to fully restore the charges of another jewel socketed in this weapon. Charges: 1." },
        { base: "Jewel of Shock", slot: "Weapon", gem: "Topaz", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 lightning damage and stop the target taking reactions. Charges: 3." },
        { base: "Jewel of Spellbreaking", slot: "Weapon", gem: "Aquamarine", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 force damage and stop the target casting spells until its next turn. Charges: 3." },
        { base: "Jewel of Summoning", slot: "Weapon", gem: "Jasper", tiers: "A", effect: "Spend a charge to summon this weapon into your free hand (within 100 ft) as a bonus action. Charges: 3." },
        { base: "Jewel of Thunderstrike", slot: "Weapon", gem: "Alexandrite", tiers: "RLA", effect: "Spend a charge to deal +1d6/1d8/1d10 thunder damage; deafen and push the target back 10 ft. Charges: 3." },
        { base: "Jewel of Transmutation", slot: "Weapon", gem: "Elemental", tiers: "A", effect: "Your weapon's normal damage becomes {el} \u2014 it deals {el} instead of its usual bludgeoning/piercing/slashing." },
        { base: "Jewel of Wrath", slot: "Weapon", gem: "Elemental", tiers: "RLA", effect: "On a critical hit, deal +4/+8/+12 {el} damage." }
    ],

    esc(v) { return String(v ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])); },
    qty(item) { return Number(item.system?.quantity ?? 1); },
    jewelersTools(actor) { return actor ? Array.from(actor.items).filter(i => /jewel+er'?s?\s+tools?/i.test(i.name ?? "")) : []; },
    alchemistsKit(actor) { return actor ? Array.from(actor.items).filter(i => /alchemist/i.test(i.name ?? "")) : []; },
    dustIsOilGrade(d) { return !!(d && d.quality && this.CRAFT_TIERS.includes(d.quality) && (d.gemType in this.ELEMENTAL_GEMS)); },
    abilityMod(actor, abl) { return Number(actor?.system?.abilities?.[abl]?.mod ?? 0); },
    gemIsOilGrade(g) { return !!(g && g.cut && this.CRAFT_TIERS.includes(g.quality)); },
    resolveElementText(text, element) {
        if (!element || !text) return text;
        return String(text)
            .replace(/your gemstone'?s elemental damage type/gi, `${element} damage`)
            .replace(/your gemstone'?s element/gi, element)
            .replace(/\{el\}/g, element);
    },
    scaleEffect(effect, idx, total) {
        return String(effect ?? "").replace(/[+\w]+(?:\/[+\w]+)+/g, (m) => { const parts = m.split("/"); return parts.length === total ? parts[idx] : m; });
    },
    jewelEffectFor(recipe, quality) { const idx = recipe.tiers.indexOf(this.TIER_LETTER[quality]); return idx < 0 ? recipe.effect : this.scaleEffect(recipe.effect, idx, recipe.tiers.length); },
    recipeAcceptsType(recipe, type) { return recipe.gem === type || (recipe.gem === "Elemental" && type in this.ELEMENTAL_GEMS); },
    craftableJewelNames(g) {
        const letter = this.TIER_LETTER[g.quality];
        if (!letter) return [];
        return this.JEWEL_RECIPES.filter(r => this.recipeAcceptsType(r, g.type) && r.tiers.includes(letter)).map(r => r.base);
    },
    // A Foundry @UUID content link to a darkitems compendium entry by item name
    // (cached index lookup). Falls back to plain text if the item isn't found.
    _packMap: null,
    async compendiumLink(itemName, display) {
        if (!this._packMap) {
            this._packMap = {};
            const pack = game.packs.get("darksheet.darkitems");
            if (pack) { const idx = await pack.getIndex(); for (const e of idx) this._packMap[e.name] = e._id; }
        }
        const id = this._packMap[itemName];
        return id ? `@UUID[Compendium.darksheet.darkitems.Item.${id}]{${display || itemName}}` : (display || itemName);
    },
    // Rebuild a gem's description for its current (cut) state. Mirrors the uncut
    // wording baked by the compendium builder, kept dash-free; jewel/oil names
    // are linked to their compendium entries.
    async cutDescription(g) {
        const el = this.ELEMENTAL_GEMS[g.type];
        const letter = this.TIER_LETTER[g.quality];
        const natureLine = el
            ? `<p><strong>${this.esc(g.type)} is an elemental gemstone (element: ${el}).</strong> Its weapon jewels and oils deal ${el} damage. Its resistance jewel and oil resist the opposed element.</p>`
            : `<p>${this.esc(g.type)} is a non-magical gemstone. Unlike elemental gemstones, it holds no innate element, so it brews no oils and its jewels deal no elemental damage.</p>`;
        let craft;
        if (!letter) {
            craft = `Royal, Lucent, or Astral quality is required to craft jewels${el ? " or oils" : ""}.`;
        } else {
            const links = [];
            for (const b of this.craftableJewelNames(g)) links.push(await this.compendiumLink(`${g.quality} ${b}`, b));
            craft = `This cut ${g.quality} ${this.esc(g.type)} can be crafted into: ${links.join(", ")}.`;
            if (el) craft += ` Ground into dust, it brews ${await this.compendiumLink(`${g.quality} ${this.OIL_BY_GEM[g.type]}`, this.OIL_BY_GEM[g.type])}.`;
        }
        return `<p><em>Cut ${this.esc(g.quality)} ${this.esc(g.type)} (gemstone)</em></p>`
            + `<p>A cut ${g.quality.toLowerCase()} ${this.esc(g.type)}, worth <strong>${g.cutValue} gp</strong>.${letter ? " It is ready for jewelcrafting." : ""} It can be ground into dust at any time.</p>`
            + natureLine
            + `<p>${craft}</p>`;
    },
    requireRecipes() { try { return !!game.settings.get("darksheet", "requireRecipes"); } catch (e) { return false; } },
    recipeListEntries(source) {
        const key = source === "public" ? "publicRecipes" : source === "shared" ? "sharedRecipes" : "";
        if (!key) return [];
        try { const value = game.settings.get("darksheet", key); return Array.isArray(value) ? value : []; }
        catch (e) { return []; }
    },
    syncRecipeItemFromUuid(uuid) {
        const raw = String(uuid || "");
        let m = raw.match(/^Actor\.([^.]+)\.Item\.([^.]+)$/);
        if (m) return game.actors.get(m[1])?.items.get(m[2]) || null;
        m = raw.match(/^Item\.([^.]+)$/);
        if (m) return game.items?.get?.(m[1]) || null;
        return null;
    },
    recipeFlagFromSharedEntry(entry, source) {
        const live = this.syncRecipeItemFromUuid(entry?.uuid);
        if (live?.flags?.darksheet?.recipe) return live.flags.darksheet.recipe;
        return source === "public" ? entry?.recipe : null;
    },
    recipeKnown(actor, kind, base) {
        if (!this.requireRecipes()) return true;
        if (actor) for (const it of actor.items) { const r = it.flags?.darksheet?.recipe; if (r && r.kind === kind && r.base === base) return true; }
        for (const source of ["public", "shared"]) {
            for (const entry of this.recipeListEntries(source)) {
                const r = this.recipeFlagFromSharedEntry(entry, source);
                if (r && r.kind === kind && r.base === base) return true;
            }
        }
        return false;
    },
    compatibleRecipes(actor, g) {
        if (!g || !g.cut || g.cracked || !this.CRAFT_TIERS.includes(g.quality)) return [];
        const letter = this.TIER_LETTER[g.quality];
        return this.JEWEL_RECIPES.filter(r => this.recipeAcceptsType(r, g.type) && r.tiers.includes(letter) && this.recipeKnown(actor, "jewel", r.base));
    },

    consumeOne(actor, item) { const q = this.qty(item); return q > 1 ? item.update({ "system.quantity": q - 1 }) : item.delete(); },
    async addArcaneDust(actor, type, value) {
        const existing = actor.items.find(i => i.flags?.darksheet?.dust?.gemType === type && i.flags?.darksheet?.dust?.value === value);
        if (existing) { await existing.update({ "system.quantity": this.qty(existing) + 1 }); return; }
        await actor.createEmbeddedDocuments("Item", [{
            name: `Arcane Dust of ${type}`, type: "loot", img: this.ARCANE_DUST_IMG,
            system: { description: { value: `<p><em>Crafting material</em></p><p>Powdered remains of a ${this.esc(type)} gemstone, worth ${value} gp. Used in jewelcrafting and enchantment.</p>`, chat: "" }, type: { value: "", subtype: "" }, rarity: "common", quantity: 1, weight: { value: 0, units: "lb" }, price: { value, denomination: "gp" }, identified: true },
            flags: { darksheet: { dust: { gemType: type, value } } }
        }]);
    },
    async addGemstoneDust(actor, type, quality, value) {
        const existing = actor.items.find(i => i.flags?.darksheet?.dust?.gemType === type && i.flags?.darksheet?.dust?.quality === quality);
        if (existing) { await existing.update({ "system.quantity": this.qty(existing) + 1 }); return; }
        const el = this.ELEMENTAL_GEMS[type];
        await actor.createEmbeddedDocuments("Item", [{
            name: `${quality} ${type} Dust`, type: "loot", img: this.ARCANE_DUST_IMG,
            system: { description: { value: `<p><em>Gemstone dust</em></p><p>Powdered ${quality} ${this.esc(type)}${el ? ` (${el} element)` : ""}, worth ${value} gp. Ground for crafting oils and enchantments.</p>`, chat: "" }, type: { value: "", subtype: "" }, rarity: "common", quantity: 1, weight: { value: 0, units: "lb" }, price: { value, denomination: "gp" }, identified: true },
            flags: { darksheet: { dust: { gemType: type, quality, value } } }
        }]);
    },
    async grind(actor, item) {
        const g = item.flags.darksheet.gem;
        await this.consumeOne(actor, item);
        return this.gemIsOilGrade(g) ? this.addGemstoneDust(actor, g.type, g.quality, g.cutValue) : this.addArcaneDust(actor, g.type, g.dustValue);
    },
    async cutInPlace(actor, item) {
        const g = item.flags.darksheet.gem;
        const newGem = { ...g, cut: true };
        const newName = `Cut ${g.quality} ${g.type}`;
        const newDesc = await this.cutDescription(newGem);
        if (this.qty(item) > 1) {
            await item.update({ "system.quantity": this.qty(item) - 1 });
            const data = item.toObject(); delete data._id; data.name = newName; data.system.quantity = 1; data.system.price = { value: g.cutValue, denomination: "gp" };
            foundry.utils.setProperty(data, "system.description.value", newDesc);
            data.flags = { ...(data.flags || {}), darksheet: { ...(data.flags?.darksheet || {}), gem: newGem } };
            await actor.createEmbeddedDocuments("Item", [data]);
        } else {
            await item.update({ name: newName, "system.price.value": g.cutValue, "system.description.value": newDesc, "flags.darksheet.gem.cut": true });
        }
    },
    async shatter(actor, item) { const g = item.flags.darksheet.gem; await this.consumeOne(actor, item); await this.addArcaneDust(actor, g.type, g.dustValue); },
    // Description for a gem that cracked during crafting - makes clear it is ruined.
    crackedDescription(g) {
        const el = this.ELEMENTAL_GEMS[g.type];
        const natureLine = el
            ? `<p>${this.esc(g.type)} is an elemental gemstone (element: ${el}).</p>`
            : `<p>${this.esc(g.type)} is a non-magical gemstone.</p>`;
        const worth = g.cut ? g.cutValue : g.uncutValue;
        return `<p><em>Cracked ${this.esc(g.quality)} ${this.esc(g.type)} (ruined gemstone)</em></p>`
            + `<p>This ${g.quality.toLowerCase()} ${this.esc(g.type)} cracked during crafting. <strong>It can no longer be cut, ground, or crafted into a jewel, potion, or oil.</strong> It is worth only its value as a gemstone (${worth} gp).</p>`
            + natureLine;
    },
    async setState(actor, item, newGem, newName, newDesc) {
        const price = newGem.cut ? newGem.cutValue : newGem.uncutValue;
        if (this.qty(item) > 1) {
            await item.update({ "system.quantity": this.qty(item) - 1 });
            const data = item.toObject(); delete data._id; data.name = newName; data.system.quantity = 1; data.system.price = { value: price, denomination: "gp" };
            if (newDesc) foundry.utils.setProperty(data, "system.description.value", newDesc);
            data.flags = { ...(data.flags || {}), darksheet: { ...(data.flags?.darksheet || {}), gem: newGem } };
            await actor.createEmbeddedDocuments("Item", [data]); return;
        }
        const upd = { name: newName, "system.price.value": price, "flags.darksheet.gem": newGem };
        if (newDesc) upd["system.description.value"] = newDesc;
        await item.update(upd);
    },
    async crack(actor, item) {
        const g = item.flags.darksheet.gem;
        const newGem = { ...g, cracked: true };
        return this.setState(actor, item, newGem, `Cracked ${g.quality} ${g.type}`, this.crackedDescription(newGem));
    },
    async downgradeAndCrack(actor, item) {
        const g = item.flags.darksheet.gem;
        const idx = this.QUALITY_LADDER.findIndex(q => q.q === g.quality);
        const lower = this.QUALITY_LADDER[Math.max(0, idx - 1)];
        const newGem = { ...g, quality: lower.q, cracked: true, uncutValue: lower.uncut, cutValue: lower.cut, dustValue: Math.floor(lower.uncut / 2), cutDC: lower.dc };
        await this.setState(actor, item, newGem, `Cracked ${lower.q} ${g.type}`, this.crackedDescription(newGem));
        return lower.q;
    },
    jewelDetailKind(base) { if (base === "Jewel of Safety") return "save"; if (base === "Jewel of Skill") return "skill"; if (base === "Jewel of Spellbinding") return "spell"; return null; },
    async promptJewelDetail(recipe) {
        const kind = this.jewelDetailKind(recipe.base);
        if (!kind) return { kind: null, value: "" };
        if (kind === "spell") {
            const v = await new Promise(resolve => {
                new Dialog({
                    title: `Imprint Spell: ${recipe.base}`,
                    content: `<form><div class="form-group"><label>Spell to store</label><input type="text" name="v" placeholder="e.g. Burning Hands" style="width:100%"></div></form>`,
                    buttons: { ok: { icon: '<i class="fas fa-check"></i>', label: "Confirm", callback: h => resolve(h[0].querySelector("[name=v]").value) }, cancel: { label: "Cancel", callback: () => resolve(null) } },
                    default: "ok", close: () => resolve(null)
                }).render(true);
            });
            if (v == null) return null;
            const t = (v || "").trim();
            return { kind, key: "", label: t, value: t };
        }
        let entries;
        if (kind === "save") {
            const abil = CONFIG?.DND5E?.abilities || {};
            entries = Object.keys(abil).length ? Object.entries(abil).map(([k, a]) => [k, a.label || a]) : [["str", "Strength"], ["dex", "Dexterity"], ["con", "Constitution"], ["int", "Intelligence"], ["wis", "Wisdom"], ["cha", "Charisma"]];
        } else {
            const sk = CONFIG?.DND5E?.skills || {};
            entries = Object.entries(sk).map(([k, s]) => [k, s.label || s]).filter(e => e[1]);
            if (!entries.length) entries = [["acr", "Acrobatics"], ["ath", "Athletics"], ["prc", "Perception"], ["ste", "Stealth"], ["ins", "Insight"], ["per", "Persuasion"]];
        }
        const opts = entries.map(([k, l]) => `<option value="${this.esc(k)}">${this.esc(l)}</option>`).join("");
        const result = await new Promise(resolve => {
            new Dialog({
                title: kind === "save" ? `Choose Saving Throw: ${recipe.base}` : `Choose Skill: ${recipe.base}`,
                content: `<form><div class="form-group"><label>${kind === "save" ? "Saving throw" : "Skill"}</label><select name="v" style="width:100%">${opts}</select></div></form>`,
                buttons: { ok: { icon: '<i class="fas fa-check"></i>', label: "Confirm", callback: h => { const s = h[0].querySelector("select[name=v]"); resolve({ key: s.value, label: s.selectedOptions[0]?.text || s.value }); } }, cancel: { label: "Cancel", callback: () => resolve(null) } },
                default: "ok", close: () => resolve(null)
            }).render(true);
        });
        return result == null ? null : { kind, key: result.key, label: result.label, value: result.label };
    },
    applyJewelDetail(data, detail) {
        if (!detail || !detail.label) return;
        const v = detail.label;
        const sub = (txt) => {
            if (!txt) return txt;
            if (detail.kind === "save") return txt.replace(/one chosen saving throw/gi, `${v} saving throws`);
            if (detail.kind === "skill") return txt.replace(/one chosen skill/gi, v);
            return txt;
        };
        data.name = `${data.name} (${v})`;
        const desc = foundry.utils.getProperty(data, "system.description.value") || "";
        let newDesc = sub(desc);
        if (detail.kind === "spell") newDesc += `<p><em>Imprinted spell:</em> <strong>${this.esc(v)}</strong></p>`;
        foundry.utils.setProperty(data, "system.description.value", newDesc);
        const fe = foundry.utils.getProperty(data, "flags.darksheet.jewel.effect");
        if (fe) foundry.utils.setProperty(data, "flags.darksheet.jewel.effect", detail.kind === "spell" ? `${fe} (stored: ${v})` : sub(fe));
        foundry.utils.setProperty(data, "flags.darksheet.jewel.detail", detail);
    },
    async createJewelOnActor(actor, jewelName, element, detail) {
        const pack = game.packs.get("darksheet.darkitems");
        if (pack) {
            const index = await pack.getIndex();
            const entry = index.find(e => e.name === jewelName);
            if (entry) {
                const doc = await pack.getDocument(entry._id);
                const data = doc.toObject(); delete data._id;
                if (element) {
                    const desc = foundry.utils.getProperty(data, "system.description.value") || "";
                    if (desc) foundry.utils.setProperty(data, "system.description.value", desc.replace(/your gemstone's elemental damage type/gi, `${element} damage`).replace(/your gemstone's element/gi, element));
                    foundry.utils.setProperty(data, "flags.darksheet.jewel.element", element);
                    const fe = foundry.utils.getProperty(data, "flags.darksheet.jewel.effect");
                    if (fe) foundry.utils.setProperty(data, "flags.darksheet.jewel.effect", this.resolveElementText(fe, element));
                }
                this.applyJewelDetail(data, detail);
                await actor.createEmbeddedDocuments("Item", [data]);
                return true;
            }
        }
        await actor.createEmbeddedDocuments("Item", [{
            name: detail?.value ? `${jewelName} (${detail.value})` : jewelName, type: "equipment", img: "icons/equipment/finger/ring-band-engraved-gold.webp",
            system: { type: { value: "trinket" }, rarity: "uncommon", quantity: 1, identified: true }
        }]);
        return true;
    },
    // Roll a dnd5e check via the system dialog, with a direct-roll fallback.
    async rollCheck(actor, kind, key, dc) {
        const major = parseInt(String(game.system?.version ?? "0"), 10) || 0;
        const waiter = darksheetBeginRollSettleWait();
        try {
            let result;
            if (kind === "tool") {
                result = major >= 4 ? await actor.rollToolCheck({ tool: key, ability: "wis", target: dc }) : await actor.rollToolCheck(key, { ability: "wis", targetValue: dc });
            } else if (kind === "skill") {
                result = major >= 4 ? await actor.rollSkill({ skill: key, target: dc }) : await actor.rollSkill(key, { targetValue: dc });
            } else if (major >= 4 && typeof actor.rollAbilityCheck === "function") {
                result = await actor.rollAbilityCheck({ ability: key, target: dc });
            } else if (typeof actor.rollAbilityTest === "function") {
                result = await actor.rollAbilityTest(key, { targetValue: dc });
            } else { throw new Error("No dnd5e roll method available"); }
            await waiter.wait(result);
            return darksheetExtractRoll(result) || result || null;
        } catch (err) {
            waiter.cancel();
            console.warn("Darksheet | System check dialog unavailable; rolling directly.", err);
            const mod = kind === "skill" ? (Darksheet._getActorSkillMod ? Darksheet._getActorSkillMod(actor, key) : 0) : kind === "tool" ? this.abilityMod(actor, "wis") : this.abilityMod(actor, key);
            const roll = await new Roll(`1d20 + ${mod}`).evaluate();
            return darksheetShowRollAndWait(roll);
        }
    },
    async pickRecipe(g, recipes) {
        const el = this.ELEMENTAL_GEMS[g.type];
        const opts = recipes.map((r, i) => { const eff = this.resolveElementText(this.jewelEffectFor(r, g.quality), el); return `<option value="${i}">${this.esc(r.base)} \u2014 ${this.esc(eff)}</option>`; }).join("");
        const idx = await new Promise(resolve => {
            new Dialog({
                title: `Craft Jewel: ${g.quality} ${g.type}`,
                content: `<form><div class="form-group"><label>Jewel to craft (DC ${this.GEM_CRAFT_DC[g.quality]} Arcana)</label><select name="r" style="width:100%">${opts}</select></div></form>`,
                buttons: { ok: { icon: '<i class="fas fa-gem"></i>', label: "Craft", callback: h => resolve(h[0].querySelector("select[name=r]").value) }, cancel: { label: "Cancel", callback: () => resolve(null) } },
                default: "ok", close: () => resolve(null)
            }).render(true);
        });
        return idx == null ? null : recipes[Number(idx)];
    },

    async cut(actor, item) {
        const g = item.flags?.darksheet?.gem; if (!actor || !g) return;
        if (g.cut) return ui.notifications.warn("Darksheet | That gem is already cut.");
        if (g.cracked) return ui.notifications.warn("Darksheet | A cracked gem can't be cut.");
        if (!this.jewelersTools(actor).length) return ui.notifications.warn("Darksheet | This character has no jeweler's tools.");
        const roll = await this.rollCheck(actor, "tool", "jeweler", g.cutDC);
        if (!roll) return;
        if (roll.total >= g.cutDC) {
            await this.cutInPlace(actor, item);
            await Darksheet.postDarkscreenChat({ actor, title: "Gemcutting", icon: "fa-gem", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> cuts the ${this.esc(g.quality)} ${this.esc(g.type)} \u2014 <span class="darkRollGreen">${roll.total}</span> vs DC ${g.cutDC}. <strong>Success!</strong> Now worth ${g.cutValue} gp.</p>` });
        } else {
            await this.shatter(actor, item);
            await Darksheet.postDarkscreenChat({ actor, title: "Gemcutting", icon: "fa-gem", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> botches the cut on the ${this.esc(g.quality)} ${this.esc(g.type)} \u2014 <span class="darkRollRed">${roll.total}</span> vs DC ${g.cutDC}. <strong>Shattered</strong> into Arcane Dust worth ${g.dustValue} gp.</p>` });
        }
    },
    async grindAction(actor, item) {
        const g = item.flags?.darksheet?.gem; if (!actor || !g) return;
        if (g.cracked) return ui.notifications.warn("Darksheet | A cracked gem can't be ground for crafting.");
        const oilGrade = this.gemIsOilGrade(g);
        const confirmed = await Dialog.confirm({
            title: "Grind Gemstone to Dust",
            content: `<p>Grind the <strong>${this.esc(g.quality)} ${this.esc(g.type)}</strong> into ${oilGrade ? "oil-grade gemstone dust" : `plain Arcane Dust (${g.dustValue} gp)`}?</p><p style="opacity:0.8;">This destroys the gem and can't be undone.</p>`,
            yes: () => true, no: () => false, defaultYes: false
        });
        if (!confirmed) return;
        await this.grind(actor, item);
        await Darksheet.postDarkscreenChat({ actor, title: "Gemcutting", icon: "fa-mortar-pestle", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> grinds ${g.cut ? "a cut" : "an uncut"} ${this.esc(g.quality)} ${this.esc(g.type)} into ${oilGrade ? "oil-grade gemstone dust" : "plain Arcane Dust"}.</p>` });
    },
    async craft(actor, item) {
        const g = item.flags?.darksheet?.gem; if (!actor || !g) return;
        if (!g.cut) return ui.notifications.warn("Darksheet | The gem must be cut first.");
        if (g.cracked) return ui.notifications.warn("Darksheet | That gem is cracked and can't be crafted.");
        if (!this.CRAFT_TIERS.includes(g.quality)) return ui.notifications.warn("Darksheet | Only Royal, Lucent, or Astral gems can be crafted into jewels.");
        if (!this.jewelersTools(actor).length) return ui.notifications.warn("Darksheet | This character has no jeweler's tools.");
        const recipes = this.compatibleRecipes(actor, g);
        if (!recipes.length) return ui.notifications.warn(this.requireRecipes() ? "Darksheet | No known jewel recipe matches this gem." : "Darksheet | No jewel recipe matches this gem.");
        const recipe = await this.pickRecipe(g, recipes);
        if (!recipe) return;
        const detail = await this.promptJewelDetail(recipe);
        if (detail === null) return;
        const dc = this.GEM_CRAFT_DC[g.quality];
        const roll = await this.rollCheck(actor, "skill", "arc", dc);
        if (!roll) return;
        const jewelName = `${g.quality} ${recipe.base}`;
        if (roll.total >= dc) {
            const crit = roll.total >= dc + 10;
            await this.consumeOne(actor, item);
            await this.createJewelOnActor(actor, jewelName, this.ELEMENTAL_GEMS[g.type], detail);
            if (crit) await this.addArcaneDust(actor, g.type, g.dustValue);
            const jewelLabel = detail?.value ? `${jewelName} (${detail.value})` : jewelName;
            await Darksheet.postDarkscreenChat({ actor, title: "Jewelcrafting", icon: "fa-ring", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> crafts a <strong>${this.esc(jewelLabel)}</strong> \u2014 <span class="darkRollGreen">${roll.total}</span> vs DC ${dc}.${crit ? " <em>Critical success \u2014 spare Arcane Dust recovered!</em>" : ""}</p>` });
        } else {
            const critFail = roll.total <= dc - 10;
            if (critFail) {
                const lower = await this.downgradeAndCrack(actor, item);
                await Darksheet.postDarkscreenChat({ actor, title: "Jewelcrafting", icon: "fa-ring", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> botches the ${this.esc(jewelName)} \u2014 <span class="darkRollRed">${roll.total}</span> vs DC ${dc}. <strong>Critical failure:</strong> the ${this.esc(g.type)} cracks and drops from ${this.esc(g.quality)} to ${this.esc(lower)}.</p>` });
            } else {
                await this.crack(actor, item);
                await Darksheet.postDarkscreenChat({ actor, title: "Jewelcrafting", icon: "fa-ring", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> fails to craft a ${this.esc(jewelName)} \u2014 <span class="darkRollRed">${roll.total}</span> vs DC ${dc}. The ${this.esc(g.quality)} ${this.esc(g.type)} <strong>cracks</strong> and can no longer be turned into a jewel.</p>` });
            }
        }
    },
    async createOilOnActor(actor, oilName, vials) {
        const pack = game.packs.get("darksheet.darkitems");
        if (pack) {
            const index = await pack.getIndex();
            const entry = index.find(e => e.name === oilName);
            if (entry) {
                const doc = await pack.getDocument(entry._id);
                const data = doc.toObject(); delete data._id;
                foundry.utils.setProperty(data, "system.quantity", vials);
                await actor.createEmbeddedDocuments("Item", [data]);
                return true;
            }
        }
        await actor.createEmbeddedDocuments("Item", [{
            name: oilName, type: "consumable", img: "icons/consumables/potions/potion-flask-corked-orange.webp",
            system: { type: { value: "trinket" }, rarity: "uncommon", quantity: vials, identified: true }
        }]);
        return true;
    },
    // Brew oil from a unit of oil-grade gemstone dust. Each elemental gem maps to
    // exactly one oil, so no recipe choice is needed.
    async craftOil(actor, item) {
        const d = item.flags?.darksheet?.dust; if (!actor || !d) return;
        if (!this.dustIsOilGrade(d)) return ui.notifications.warn("Darksheet | Only Royal, Lucent, or Astral elemental gem dust can be brewed into oil.");
        const base = this.OIL_BY_GEM[d.gemType];
        if (!base) return ui.notifications.warn("Darksheet | This dust has no oil recipe.");
        if (!this.recipeKnown(actor, "oil", base)) return ui.notifications.warn(`Darksheet | This character doesn't know the recipe for ${base}.`);
        if (!this.alchemistsKit(actor).length) return ui.notifications.warn("Darksheet | This character has no alchemist's kit.");
        const dc = this.GEM_CRAFT_DC[d.quality];
        const roll = await this.rollCheck(actor, "skill", "arc", dc);
        if (!roll) return;
        const oilName = `${d.quality} ${base}`;
        await this.consumeOne(actor, item); // dust is consumed whether or not the batch succeeds
        if (roll.total >= dc) {
            const crit = roll.total >= dc + 10;
            const vials = crit ? 3 : 2;
            await this.createOilOnActor(actor, oilName, vials);
            await Darksheet.postDarkscreenChat({ actor, title: "Alchemy", icon: "fa-flask", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> brews <strong>${vials}x ${this.esc(oilName)}</strong> from ${this.esc(d.gemType)} dust \u2014 <span class="darkRollGreen">${roll.total}</span> vs DC ${dc}.${crit ? " <em>Critical success!</em>" : ""}</p>` });
        } else {
            await Darksheet.postDarkscreenChat({ actor, title: "Alchemy", icon: "fa-flask", whisper: "gm", body: `<p><strong>${this.esc(actor.name)}</strong> fails to brew ${this.esc(oilName)} \u2014 <span class="darkRollRed">${roll.total}</span> vs DC ${dc}. The batch spoils and the ${this.esc(d.gemType)} dust is wasted.</p>` });
        }
    },
    // Buttons to show for a gem (uncut -> Cut + Grind Down; cut+craftable -> Craft Jewel).
    buttonsFor(g) {
        const out = [];
        if (!g || g.cracked) return out;
        if (g.cut) { if (this.CRAFT_TIERS.includes(g.quality)) out.push({ action: "craft", icon: "fa-ring", label: "Craft Jewel" }); }
        else { out.push({ action: "cut", icon: "fa-gem", label: "Cut" }); out.push({ action: "grind", icon: "fa-mortar-pestle", label: "Grind Down" }); }
        return out;
    },
    // Buttons to show for gemstone dust (oil-grade -> Craft Oil).
    buttonsForDust(d) {
        return this.dustIsOilGrade(d) ? [{ action: "oil", icon: "fa-flask", label: "Craft Oil" }] : [];
    },
    oilGemFor(base) { for (const [gem, oil] of Object.entries(this.OIL_BY_GEM)) if (oil === base) return gem; return ""; },
    // Crafting card from the recipe flag. A recipe is recipe-level (kind, tools,
    // time) plus a list of `variants` (one output each: materials, check, result).
    // Stored fields win; missing data falls back to computed defaults so
    // legacy/custom recipes still render.
    blueprintInfo(flag) {
        if (!flag) return null;
        const c = this._computedBlueprint(flag) || {};
        const fallbackImg = c.resultImg || "icons/sundries/scrolls/scroll-runed-brown.webp";
        let raw = Array.isArray(flag.variants) && flag.variants.length ? flag.variants : null;
        // Legacy single-output recipe flag -> wrap as one variant.
        if (!raw && (flag.result || flag.resultUuid || flag.ingredients)) {
            raw = [{ result: flag.result, resultUuid: flag.resultUuid, resultImg: flag.resultImg, materials: flag.materials, checkSkill: flag.checkSkill, checkDc: flag.checkDc, check: flag.check }];
        }
        if (!raw) raw = c.variants || [];
        const variants = raw.map(v => ({
            result: v.result || "",
            resultUuid: v.resultUuid || "",
            resultImg: v.resultImg || fallbackImg,
            materials: (Array.isArray(v.materials) ? v.materials : []).map(m => this.normalizeMaterial(m)),
            checkSkill: v.checkSkill || "",
            checkDc: v.checkDc || "",
            check: this.composeCheck(v.checkSkill, v.checkDc) || v.check || ""
        }));
        return {
            kind: flag.kind || c.kind || "custom",
            kindLabel: flag.kindLabel || c.kindLabel || "Recipe",
            tools: flag.tools || c.tools || "",
            time: this.composeTime(flag.timeValue, flag.timeUnit) || flag.time || c.time || "8 hours",
            variants
        };
    },
    composeTime(value, unit) {
        const n = Number(value);
        if (!n || !unit) return "";
        const u = (n === 1 && unit.endsWith("s")) ? unit.slice(0, -1) : unit;
        return `${n} ${u}`;
    },
    timeUnits() { return ["minutes", "hours", "days", "weeks", "months", "years"]; },
    // Build a check label from a key that is EITHER a skill ("Ability (Skill)")
    // or a flat ability ("Ability"), plus the DC.
    composeCheck(key, dc) {
        let label = "";
        if (key === "flexible") label = "Flexible";
        else {
            const sk = CONFIG?.DND5E?.skills?.[key];
            if (sk) {
                const skLabel = sk.label || key;
                const ablLabel = CONFIG?.DND5E?.abilities?.[sk.ability]?.label || (sk.ability ? sk.ability.toUpperCase() : "");
                label = ablLabel ? `${ablLabel} (${skLabel})` : skLabel;
            } else if (key) {
                const ab = CONFIG?.DND5E?.abilities?.[key];
                label = ab ? (ab.label || key) : key;
            }
        }
        const dcPart = dc ? `DC ${dc}` : "";
        return [label, dcPart].filter(Boolean).join(", ");
    },
    // One combined list: a "Flexible" option (gatherer picks the skill), then flat
    // ability checks + skill checks, each labelled in full.
    checkOptions() {
        const out = [{ key: "flexible", label: "Flexible (gatherer chooses)" }];
        const ab = CONFIG?.DND5E?.abilities || {};
        for (const [key, a] of Object.entries(ab)) out.push({ key, label: a.label || key });
        const sk = CONFIG?.DND5E?.skills || {};
        for (const [key, s] of Object.entries(sk)) {
            const ablLabel = ab[s.ability]?.label || (s.ability ? s.ability.toUpperCase() : "");
            out.push({ key, label: ablLabel ? `${ablLabel} (${s.label || key})` : (s.label || key) });
        }
        return out;
    },
    // Default skill pre-selected in a Flexible dropdown.
    FLEX_DEFAULT: "sur",
    // A gather/harvest "Check" stat tile. For "flexible" it embeds a skill picker
    // right in the dialog so the gatherer chooses before rolling; otherwise it's
    // the static check label.
    flexibleCheckTile(skill, dc) {
        if (skill !== "flexible") {
            return `<div class="dg-stat"><i class="fas fa-dice-d20"></i><div class="dg-stat__t"><span class="dg-stat__l">Check</span><span class="dg-stat__v">${this.esc(this.composeCheck(skill, dc))}</span></div></div>`;
        }
        const opts = this.checkOptions().filter(o => o.key !== "flexible");
        const options = opts.map(o => `<option value="${this.esc(o.key)}"${o.key === this.FLEX_DEFAULT ? " selected" : ""}>${this.esc(o.label)}</option>`).join("");
        return `<div class="dg-stat dg-stat--wide"><i class="fas fa-dice-d20"></i><div class="dg-stat__t"><span class="dg-stat__l">Check${dc ? ` - DC ${dc}` : ""}</span><select class="dg-flex-select">${options}</select></div></div>`;
    },
    // Read the chosen skill from a dialog that used flexibleCheckTile().
    readFlexibleChoice(html) {
        const root = html?.[0] ?? html;
        return root?.querySelector?.(".dg-flex-select")?.value || null;
    },
    // Ask the gatherer which skill/ability to use for a "Flexible" check (used
    // where there's no in-dialog dropdown, e.g. the recipe crafting button).
    // Returns a skill/ability key, or null if cancelled.
    async promptFlexible() {
        const opts = this.checkOptions().filter(o => o.key !== "flexible");
        const select = `<select name="dsflex" style="width:100%">${opts.map(o => `<option value="${this.esc(o.key)}">${this.esc(o.label)}</option>`).join("")}</select>`;
        return new Promise(resolve => {
            let done = false;
            const finish = (v) => { if (!done) { done = true; resolve(v); } };
            new Dialog({
                title: "Choose your approach",
                content: `<form><div class="form-group"><label>Skill or ability to use</label>${select}</div></form>`,
                buttons: {
                    ok: { icon: '<i class="fas fa-dice-d20"></i>', label: "Roll", callback: h => finish((h[0] ?? h).querySelector("select[name=dsflex]")?.value || null) },
                    cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => finish(null) }
                },
                default: "ok", close: () => finish(null)
            }).render(true);
        });
    },
    dcOptions() { return [5, 8, 10, 12, 15, 18, 20, 25, 30]; },
    // ----- Active Crafting materials (ch.13) -----
    MAT_RARITIES: [
        { key: "common", label: "Common" }, { key: "uncommon", label: "Uncommon" }, { key: "rare", label: "Rare" },
        { key: "veryRare", label: "Very rare" }, { key: "legendary", label: "Legendary" }, { key: "artifact", label: "Unique" }
    ],
    SUBSTANCES: ["bone", "ceramic", "fabric", "flesh", "fluid", "gas", "glass", "metal", "otherworldly", "plant", "skin", "stone", "wood"],
    ELEMENTS: ["acid", "air", "earth", "fire", "force", "lightning", "necrotic", "none", "poison", "psychic", "radiant", "water"],
    materialInfo(flag) {
        if (!flag) return null;
        const r = this.MAT_RARITIES.find(x => x.key === flag.rarity);
        return { rarity: flag.rarity || "", rarityLabel: r ? r.label : (flag.rarity || ""), substance: flag.substance || "", element: flag.element || "" };
    },
    // Fragility notch-count -> tier name (mirrors the item-sheet Fragility options).
    FRAGILITY_LABELS: { "1": "Delicate", "2": "Frail", "3": "Basic", "5": "Solid", "10": "Sturdy", "15": "Durable", "20": "Very Sturdy", "50": "Fabled", "100": "Indestructible" },
    fragilityLabel(value) { return this.FRAGILITY_LABELS[String(value)] || `${value} notches`; },
    // A recipe ingredient is EITHER a specific item ({uuid,name,img,qty}) or a
    // material-type requirement ({match:{rarity,substance,element}, qty}) that any
    // owned crafting material with matching attributes satisfies. Blank attr = any.
    GENERIC_MAT_IMG: "icons/svg/item-bag.svg",
    matchLabel(match) {
        if (!match) return "Any material";
        const parts = [];
        if (match.rarity) { const r = this.MAT_RARITIES.find(x => x.key === match.rarity); parts.push(r ? r.label.toLowerCase() : match.rarity); }
        if (match.substance) parts.push(match.substance);
        let label = "Any " + (parts.join(" ") || "material");
        if (match.element && match.element !== "none") label += ` (${match.element})`;
        return label;
    },
    // Normalise an ingredient for display: fill in a label/img for type-matches.
    normalizeMaterial(m) {
        if (m && m.match) {
            const label = this.matchLabel(m.match);
            return { match: { rarity: m.match.rarity || "", substance: m.match.substance || "", element: m.match.element || "" },
                qty: Math.max(1, Number(m.qty) || 1), name: m.name || label, matchLabel: label, img: m.img || this.GENERIC_MAT_IMG };
        }
        return m;
    },
    // All crafting materials in the darkitems compendium (cached), with props.
    async compendiumMaterials() {
        if (this._matIndexCache) return this._matIndexCache;
        const pack = game.packs.get("darksheet.darkitems");
        if (!pack) return (this._matIndexCache = []);
        let idx;
        try { idx = await pack.getIndex({ fields: ["flags.darksheet.material", "img"] }); }
        catch (e) { idx = await pack.getIndex(); }
        this._matIndexCache = [...idx].filter(e => e.flags?.darksheet?.material).map(e => ({
            name: e.name, img: e.img, uuid: `Compendium.darksheet.darkitems.Item.${e._id}`,
            rarity: e.flags.darksheet.material.rarity || "", substance: e.flags.darksheet.material.substance || "", element: e.flags.darksheet.material.element || ""
        }));
        return this._matIndexCache;
    },
    // Lazily-built, cached index of "result item -> recipes that make it", keyed by
    // result UUID and by lower-cased result name. Built once per session (one pack
    // getIndex + a world-items scan) and invalidated by item CRUD hooks, so the
    // per-sheet "does a recipe exist?" lookup stays O(1).
    _recipeIndexCache: null,
    recipeNameKeys(name) {
        const raw = String(name || "").trim().replace(/\s+/g, " ");
        if (!raw) return [];
        const norm = raw.toLowerCase();
        const keys = new Set([norm]);
        const addHealingAliases = (grade) => {
            if (!grade) return;
            keys.add(`${grade} potion of healing`);
            keys.add(`potion of ${grade} healing`);
            keys.add(`flask of ${grade} healing`);
        };
        let match = norm.match(/^(lesser|greater|superior|supreme) potion of healing$/);
        if (match) addHealingAliases(match[1]);
        match = norm.match(/^potion of (lesser|greater|superior|supreme) healing$/);
        if (match) addHealingAliases(match[1]);
        match = norm.match(/^flask of (lesser|greater|superior|supreme) healing$/);
        if (match) addHealingAliases(match[1]);
        if (norm === "potion of healing" || norm === "lesser potion of healing" || norm === "flask of lesser healing") {
            keys.add("potion of healing");
            keys.add("lesser potion of healing");
            keys.add("flask of lesser healing");
        }
        return [...keys];
    },
    async recipeIndex() {
        if (this._recipeIndexCache) return this._recipeIndexCache;
        const map = new Map();
        const addKey = (key, rec) => { if (!key) return; let a = map.get(key); if (!a) map.set(key, a = []); if (!a.some(r => r.uuid === rec.uuid)) a.push(rec); };
        const addRecipe = (uuid, name, img, flag) => {
            const rec = { uuid, name, img };
            for (const v of (flag?.variants || [])) {
                if (v.resultUuid) addKey("uuid:" + v.resultUuid, rec);
                for (const key of this.recipeNameKeys(v.result)) addKey("name:" + key, rec);
            }
        };
        const pack = game.packs.get("darksheet.darkitems");
        if (pack) {
            let idx;
            try { idx = await pack.getIndex({ fields: ["flags.darksheet.recipe", "img"] }); } catch (e) { idx = await pack.getIndex(); }
            for (const e of idx) { const f = e.flags?.darksheet?.recipe; if (f) addRecipe(`Compendium.darksheet.darkitems.Item.${e._id}`, e.name, e.img, f); }
        }
        for (const it of (game.items ?? [])) { const f = it.flags?.darksheet?.recipe; if (f) addRecipe(it.uuid, it.name, it.img, f); }
        this._recipeIndexCache = map;
        return map;
    },
    // Recipes whose output is this item (matched by UUID, compendium source, or name).
    async recipesForItem(item) {
        if (!item) return [];
        const map = await this.recipeIndex();
        const out = new Map();
        const take = (key) => { for (const r of (map.get(key) || [])) out.set(r.uuid, r); };
        const uuids = new Set();
        if (item.uuid) uuids.add(item.uuid);
        const src = item._stats?.compendiumSource || item.flags?.core?.sourceId;
        if (src) uuids.add(src);
        for (const u of uuids) take("uuid:" + u);
        for (const key of this.recipeNameKeys(item.name)) take("name:" + key);
        // Don't list a recipe item as a recipe "for itself".
        out.delete(item.uuid);
        return [...out.values()];
    },
    // GM helper: for each recipe requirement, show which compendium materials satisfy it.
    async showRecipeMaterials(item) {
        const bp = this.blueprintInfo(item?.flags?.darksheet?.recipe);
        if (!bp) return ui.notifications.warn("Darksheet | This item isn't a recipe.");
        const mats = await this.compendiumMaterials();
        const rarOrder = { common: 0, uncommon: 1, rare: 2, veryRare: 3, legendary: 4, artifact: 5 };
        // A material satisfies a spec if its substance/element fit and its rarity is
        // equal OR higher (the book's substitution rule: substitute up, never down).
        const sat = (m, s) => (!s.rarity || (rarOrder[m.rarity] ?? -1) >= (rarOrder[s.rarity] ?? 0)) && (!s.substance || m.substance === s.substance) && (!s.element || m.element === s.element);
        const rarLabel = (r) => this.MAT_RARITIES.find(x => x.key === r)?.label || r || "any";
        const chip = (cls, txt) => `<span class="darksheet-mat-chip ${cls}">${this.esc(txt)}</span>`;
        // One list row per material: small icon + name (link), then rarity /
        // substance / element tags - the same chips the material sheet renders.
        const matRow = (mm) => `<div class="ds-matcheck-item">`
            + `<a class="content-link ds-matcheck-item__link" draggable="true" data-link data-uuid="${mm.uuid}" data-type="Item" data-tooltip="Drag onto a sheet, or click to open \u00B7 ${this.esc(mm.name)}"><img src="${mm.img}"><span>${this.esc(mm.name)}</span></a>`
            + `<span class="ds-matcheck-tags">`
            + chip(`darksheet-mat-rar-${mm.rarity}`, rarLabel(mm.rarity))
            + (mm.substance ? chip("", mm.substance) : "")
            + (mm.element && mm.element !== "none" ? chip(`darksheet-mat-el-${mm.element}`, mm.element) : "")
            + `</span></div>`;
        const link = (uuid, name, img) => `<a class="content-link" draggable="true" data-link data-uuid="${uuid}" data-type="Item" data-tooltip="Drag onto a sheet, or click to open \u00B7 ${this.esc(name)}"><img src="${img}">${this.esc(name)}</a>`;
        let body = "";
        bp.variants.forEach((v, vi) => {
            body += `<div class="ds-matcheck-out"><div class="ds-matcheck-out__h">${this.esc(v.result || ("Output " + (vi + 1)))}</div>`;
            for (const m of (v.materials || [])) {
                const qty = m.qty || 1;
                if (m.match) {
                    const found = mats.filter(mm => sat(mm, m.match)).sort((a, b) => (rarOrder[a.rarity] ?? 9) - (rarOrder[b.rarity] ?? 9) || a.name.localeCompare(b.name));
                    body += `<div class="ds-matcheck-req"><div class="ds-matcheck-req__h"><span><i class="fas fa-shapes"></i> ${this.esc(this.matchLabel(m.match))} <span class="ds-matcheck-qty">\u00D7${qty}</span></span><span class="ds-matcheck-count ${found.length ? "" : "is-zero"}">${found.length} match${found.length === 1 ? "" : "es"}</span></div>`;
                    body += found.length
                        ? `<div class="ds-matcheck-list">${found.map(matRow).join("")}</div>`
                        : `<div class="ds-matcheck-none">No compendium material satisfies this \u2014 consider adding one.</div>`;
                    body += `</div>`;
                } else {
                    const label = m.uuid ? link(m.uuid, m.name || "Item", m.img || "icons/commodities/materials/bowl-powder-blue.webp") : `<i class="fas fa-cube"></i> ${this.esc(m.name || "Material")}`;
                    body += `<div class="ds-matcheck-req"><div class="ds-matcheck-req__h"><span>${label} <span class="ds-matcheck-qty">\u00D7${qty}</span></span><span class="ds-matcheck-count">${m.uuid ? "specific item" : "by name / runtime"}</span></div></div>`;
                }
            }
            body += `</div>`;
        });
        const content = `<div class="ds-matcheck">${body || "<p>This recipe has no material requirements.</p>"}</div>`;
        new Dialog({
            title: `Usable materials \u2014 ${item.name}`,
            content,
            buttons: { close: { icon: '<i class="fas fa-check"></i>', label: "Close" } },
            default: "close",
            render: (h) => {
                const root = h?.[0] ?? h;
                root?.querySelectorAll?.(".content-link[data-uuid]").forEach(a => {
                    // Click opens the item; drag drops it onto a sheet (standard Item drag data).
                    a.addEventListener("click", async (e) => {
                        e.preventDefault();
                        const doc = await fromUuid(a.dataset.uuid).catch(() => null);
                        doc?.sheet?.render(true);
                    });
                    a.setAttribute("draggable", "true");
                    a.addEventListener("dragstart", (e) => {
                        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "Item", uuid: a.dataset.uuid }));
                        e.dataTransfer.effectAllowed = "copy";
                        const img = a.querySelector("img");
                        if (img) try { e.dataTransfer.setDragImage(img, 8, 8); } catch (_) {}
                    });
                });
            }
        }, { classes: ["darksheet-matcheck-dialog"], width: 480 }).render(true);
    },
    // Computed defaults (with per-tier variants) for the known recipe kinds.
    _computedBlueprint(flag) {
        if (!flag || !flag.base) return null;
        const base = flag.base, kind = flag.kind;
        const tn = { R: "Royal", L: "Lucent", A: "Astral" }, dcMap = { R: 15, L: 20, A: 25 };
        const ICON = {
            jewel: "icons/sundries/scrolls/scroll-runed-brown.webp",
            oil: "icons/consumables/potions/potion-flask-corked-orange.webp",
            potion: "icons/consumables/potions/bottle-round-corked-red.webp"
        };
        if (kind === "jewel") {
            const r = this.JEWEL_RECIPES.find(x => x.base === base);
            const tiers = r ? r.tiers : "RLA";
            const gemLabel = (r && r.gem === "Elemental") ? "elemental gemstone" : `${r ? r.gem : ""} gemstone`;
            const variants = tiers.split("").map((l) => ({
                result: `${tn[l]} ${base}`, resultUuid: "", resultImg: ICON.jewel,
                materials: [{ name: `Cut ${tn[l]} ${gemLabel}`, qty: 1 }], checkSkill: "arc", checkDc: dcMap[l]
            }));
            return { kind, kindLabel: "Arcane Jewel", tools: "Jeweler's tools", time: "8 hours", resultImg: ICON.jewel, variants };
        }
        if (kind === "oil") {
            const gem = this.oilGemFor(base);
            const variants = ["R", "L", "A"].map(l => ({
                result: `${tn[l]} ${base}`, resultUuid: "", resultImg: ICON.oil,
                materials: [{ name: `${tn[l]} ${gem} dust`, qty: 1 }], checkSkill: "arc", checkDc: dcMap[l]
            }));
            return { kind, kindLabel: "Magical Oil", tools: "Alchemist's kit", time: "8 hours", resultImg: ICON.oil, variants };
        }
        if (kind === "potion") {
            return { kind, kindLabel: "Potion", tools: "Alchemist's kit", time: "8 hours", resultImg: ICON.potion,
                variants: [{ result: base, resultUuid: "", resultImg: ICON.potion, materials: [{ name: "Alchemical reagents", qty: 1 }], checkSkill: "arc", checkDc: 15 }] };
        }
        return null;
    },
    // Initialise a blank recipe flag (one empty output).
    blankRecipeFlag(item) {
        return { kind: "custom", base: item?.name || "New Recipe", kindLabel: "Recipe",
            tools: "", timeValue: 8, timeUnit: "hours",
            variants: [{ result: "", resultUuid: "", resultImg: "", materials: [], checkSkill: "arc", checkDc: 15 }] };
    },
    blankVariant() { return { result: "", resultUuid: "", resultImg: "", materials: [], checkSkill: "arc", checkDc: 15 }; },
    // A recipe flag whose single output IS the given item (for "make a recipe for this item").
    recipeFlagForResult(item) {
        return { kind: "custom", base: item?.name || "New Recipe", kindLabel: "Recipe",
            tools: "", timeValue: 8, timeUnit: "hours",
            variants: [{ result: item?.name || "", resultUuid: item?.uuid || "", resultImg: item?.img || "", materials: [], checkSkill: "arc", checkDc: 15 }] };
    },
    run(action, actor, item) {
        if (action === "cut") return this.cut(actor, item);
        if (action === "grind") return this.grindAction(actor, item);
        if (action === "craft") return this.craft(actor, item);
        if (action === "oil") return this.craftOil(actor, item);
    }
};
try { window.DarksheetGem = DSGEM; } catch (e) {}

// Invalidate the "recipe for item" index whenever a recipe item is created,
// changed, or deleted (cheap to rebuild on next sheet open).
Hooks.on("createItem", (it) => { if (it?.flags?.darksheet?.recipe) DSGEM._recipeIndexCache = null; darksheetScheduleEncumbranceSync(it?.parent, { delay: 250 }); });
Hooks.on("deleteItem", (it) => { if (it?.flags?.darksheet?.recipe) DSGEM._recipeIndexCache = null; darksheetScheduleEncumbranceSync(it?.parent, { delay: 250 }); });
Hooks.on("updateItem", (it, ch) => { if (it?.flags?.darksheet?.recipe || foundry.utils.getProperty(ch || {}, "flags.darksheet.recipe")) DSGEM._recipeIndexCache = null; darksheetScheduleEncumbranceSync(it?.parent, { delay: 250 }); });

// Create a Darksheet Recipe item (a loot item carrying a recipe flag).
// resultItem - its single output is that item. Created on parent actor, in a
// pack, or in the world Items directory.
async function darksheetCreateRecipeItem({ name = null, folder = null, parent = null, pack = null, resultItem = null } = {}) {
    const RECIPE_ICON = "icons/sundries/scrolls/scroll-runed-brown.webp";
    const flag = resultItem ? DSGEM.recipeFlagForResult(resultItem) : DSGEM.blankRecipeFlag({ name: name || "New Recipe" });
    const finalName = name || (resultItem ? `Recipe: ${resultItem.name}` : "New Recipe");
    const data = { name: finalName, type: "loot", img: RECIPE_ICON, flags: { darksheet: { recipe: flag } } };
    if (folder) data.folder = folder;
    let created;
    if (parent) created = (await parent.createEmbeddedDocuments("Item", [data]))[0];
    else created = await Item.create(data, pack ? { pack } : {});
    created?.sheet?.render(true);
    return created;
}
// Add a "Darksheet Recipe" choice to the dnd5e Create Item dialog (GM only).
Hooks.on("renderCreateDocumentDialog", (app, html) => {
    try {
        if (!game.user?.isGM || app?.documentName !== "Item") return;
        const root = html instanceof HTMLElement ? html : (html?.[0] ?? (app.element instanceof HTMLElement ? app.element : app.element?.[0]));
        if (!root) return;
        const ol = root.querySelector("ol.unlist.card");
        if (!ol || ol.querySelector('input[value="darksheet-recipe"]')) return;
        const li = document.createElement("li");
        li.dataset.tooltip = "A Darksheet crafting recipe";
        li.innerHTML = `<label><img src="icons/sundries/scrolls/scroll-runed-brown.webp" alt="Darksheet Recipe" class="gold-icon" style="width:32px;height:32px;"><span>Darksheet Recipe</span><input type="radio" name="type" value="darksheet-recipe"></label>`;
        ol.appendChild(li);
        const form = root.matches("form") ? root : (root.querySelector("form") || root.closest("form"));
        if (form && !form._dsRecipeWired) {
            form._dsRecipeWired = true;
            form.addEventListener("submit", async (ev) => {
                const sel = form.querySelector('input[name="type"]:checked');
                if (sel?.value !== "darksheet-recipe") return; // let normal creation proceed
                ev.preventDefault();
                ev.stopImmediatePropagation();
                const name = (form.querySelector('input[name="name"]')?.value || "").trim() || "New Recipe";
                const folder = form.querySelector('select[name="folder"]')?.value || null;
                const parent = app.options?.createOptions?.parent ?? null;
                const pack = app.options?.createOptions?.pack ?? null;
                app.close();
                await darksheetCreateRecipeItem({ name, folder, parent, pack });
            }, true);
        }
    } catch (e) { console.warn("Darksheet | create-dialog recipe option failed", e); }
});

/* =====
 Active Crafting - Resource Nodes (Giffyglyph ch.13)
 GM authors node definitions (stored as a world setting); nodes are placed on
 scenes as map Notes that show to the GM always and to players when an owned
 token is near. Clicking a node opens the gathering dialog (skill check vs DC,
 harvest rules, depletes the node, grants materials). Optional required tool.
 ===== */
function darksheetMaterialStackKeyFromData(data = {}, { ignoreSource = false } = {}) {
    const material = data.flags?.darksheet?.material;
    const sourceUuid = String(
        data.flags?.darksheet?.sourceMaterialUuid
        || data.flags?.core?.sourceId
        || data.flags?.core?.sourceUUID
        || ""
    ).trim();
    if (!ignoreSource && sourceUuid) return `source:${sourceUuid}`;
    const type = String(data.type || "loot").trim().toLowerCase();
    const name = String(data.name || "Material").trim().toLowerCase();
    if (material && typeof material === "object") {
        const rarity = String(material.rarity || "").trim().toLowerCase();
        const substance = String(material.substance || "").trim().toLowerCase();
        const element = String(material.element || "").trim().toLowerCase();
        return `material:${type}:${name}:${rarity}:${substance}:${element}`;
    }
    const img = String(data.img || "").trim().toLowerCase();
    return `item:${type}:${name}:${img}`;
}

function darksheetMaterialStackKeysFromData(data = {}) {
    return new Set([
        darksheetMaterialStackKeyFromData(data),
        darksheetMaterialStackKeyFromData(data, { ignoreSource: true })
    ].filter(Boolean));
}

function darksheetMaterialStackKeysFromItem(item) {
    return darksheetMaterialStackKeysFromData(item?.toObject?.() ?? item ?? {});
}

function darksheetItemQuantity(itemOrData) {
    const value = Number(foundry.utils.getProperty(itemOrData, "system.quantity") ?? itemOrData?.system?.quantity ?? 1);
    return Number.isFinite(value) ? value : 1;
}

async function darksheetGrantStackableItem(actor, data, quantity = 1) {
    if (!actor || !data) return null;
    const qty = Math.max(1, Number(quantity) || 1);
    const sourceUuid = String(data.flags?.core?.sourceId || data.flags?.core?.sourceUUID || data.flags?.darksheet?.sourceMaterialUuid || "").trim();
    if (sourceUuid) foundry.utils.setProperty(data, "flags.darksheet.sourceMaterialUuid", sourceUuid);
    foundry.utils.setProperty(data, "system.quantity", qty);

    const keys = darksheetMaterialStackKeysFromData(data);
    const existing = actor.items?.find?.(item => {
        const itemKeys = darksheetMaterialStackKeysFromItem(item);
        return Array.from(keys).some(key => itemKeys.has(key));
    });
    if (existing) {
        const current = Math.max(0, darksheetItemQuantity(existing));
        const updateData = { "system.quantity": current + qty };
        const hidden = foundry.utils.getProperty(data, "flags.darksheet.material.hidden");
        if (hidden !== undefined) {
            updateData["flags.darksheet.material.hidden"] = !!hidden;
            updateData["flags.darksheet.srdMat.hidden"] = !!hidden;
        }
        await existing.update(updateData);
        return existing;
    }
    const created = await actor.createEmbeddedDocuments("Item", [data]);
    return created?.[0] ?? null;
}

const DSNODE = {
    GATHER_UNITS: ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
    getDefs() { try { return foundry.utils.deepClone(game.settings.get("darksheet", "nodes") || []); } catch (e) { return []; } },
    async saveDefs(defs) { return game.settings.set("darksheet", "nodes", defs); },
    getDef(id) { return this.getDefs().find(n => n.id === id) || null; },
    blankDef() {
        return { id: foundry.utils.randomID(), name: "New Node", img: "modules/darksheet/icons/ore.svg", markerImg: "modules/darksheet/icons/ore.svg",
            richnessMax: 10, gatherValue: 1, gatherUnit: "hours", skill: "ath", dc: 15, requiredItem: null, loot: [] };
    },
    async upsert(def) {
        const defs = this.getDefs();
        const i = defs.findIndex(n => n.id === def.id);
        if (i >= 0) defs[i] = def; else defs.push(def);
        await this.saveDefs(defs);
    },
    async remove(id) { await this.saveDefs(this.getDefs().filter(n => n.id !== id)); },

    // Standard nodes shipped with the module. Seeded once (GM) into the world's
    // node list so a fresh world starts with usable examples; they're ordinary
    // entries afterwards (editable, duplicable, deletable - deletion sticks).
    DEFAULT_DEFS: [
        {
            id: "ds-default-copper-node", name: "Copper Node",
            img: "modules/darksheet/icons/ore.svg", markerImg: "icons/commodities/stone/ore-chunk-yellow-brown.webp",
            richnessMax: 10, gatherValue: 1, gatherUnit: "hours", skill: "ath", dc: 12,
            requiredItem: { name: "Miner's Pick" },
            loot: [
                { name: "Copper Ore", img: "icons/commodities/stone/ore-chunk-copper-orange.webp", qty: 1, chance: 100 },
                { name: "Uncut Cloudy Topaz", img: "icons/commodities/gems/gem-faceted-octagon-yellow.webp", qty: 1, chance: 15, hidden: true }
            ]
        },
        {
            id: "ds-default-fishing-spot", name: "Fishing Spot",
            img: "modules/darksheet/icons/fishing-pole.svg", markerImg: "icons/magic/water/orb-water-bubbles-blue.webp",
            richnessMax: 10, gatherValue: 1, gatherUnit: "hours", skill: "ins", dc: 12,
            requiredItem: { name: "Fishing Tackle" },
            loot: [
                { name: "Flame Bass", img: "icons/commodities/treasure/fish-blue.webp", qty: 1, chance: 100 }
            ]
        }
    ],
    // Resolve an item name to a live {name, img, uuid}: world items first, then the
    // darkitems compendium, then any other Item compendium (tools live in dnd5e packs).
    async _resolveRef(name, fallbackImg) {
        const w = game.items?.getName?.(name);
        if (w) return { name, img: w.img, uuid: w.uuid };
        const packs = [game.packs.get("darksheet.darkitems"),
            ...(game.packs?.filter(p => p.documentName === "Item" && p.collection !== "darksheet.darkitems") || [])];
        for (const pack of packs) {
            if (!pack) continue;
            try {
                const idx = await pack.getIndex();
                const e = idx.find(x => x.name === name);
                if (e) return { name, img: e.img || fallbackImg || "", uuid: `Compendium.${pack.collection}.Item.${e._id}` };
            } catch (err) { /* skip unreadable packs */ }
        }
        return { name, img: fallbackImg || "", uuid: null };
    },
    async seedDefaults() {
        if (!game.user.isGM) return;
        let seeded = false;
        try { seeded = game.settings.get("darksheet", "nodesSeeded"); } catch (e) {}
        if (seeded) return;
        const existing = this.getDefs();
        const haveId = new Set(existing.map(d => d.id));
        // Don't duplicate a node the GM already authored by hand with the same name.
        const haveName = new Set(existing.map(d => String(d.name || "").trim().toLowerCase()));
        const toAdd = [];
        for (const tpl of this.DEFAULT_DEFS) {
            if (haveId.has(tpl.id) || haveName.has(tpl.name.trim().toLowerCase())) continue;
            const def = foundry.utils.deepClone(tpl);
            if (def.requiredItem?.name) {
                const r = await this._resolveRef(def.requiredItem.name, def.requiredItem.img);
                def.requiredItem = r;
            }
            def.loot = [];
            for (const l of (tpl.loot || [])) {
                const r = await this._resolveRef(l.name, l.img);
                def.loot.push({ ...r, qty: l.qty ?? 1, chance: l.chance ?? 100, ...(l.hidden ? { hidden: true } : {}) });
            }
            toAdd.push(def);
        }
        if (toAdd.length) await this.saveDefs(existing.concat(toAdd));
        try { await game.settings.set("darksheet", "nodesSeeded", true); } catch (e) {}
    },

    // ----- scene placement (map Notes) -----
    async placeOnScene(scene, defId, x, y) {
        const def = this.getDef(defId);
        if (!def || !scene) return;
        await scene.createEmbeddedDocuments("Note", [{
            x, y, text: def.name, texture: { src: def.img }, iconSize: 40, fontSize: 16,
            textAnchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM, global: true,
            flags: { darksheet: { node: { defId, quantity: def.richnessMax } } }
        }]);
        ui.notifications.info(`Darksheet | Placed node "${def.name}".`);
    },
    nodeOf(noteDoc) { return noteDoc?.flags?.darksheet?.node || noteDoc?.document?.flags?.darksheet?.node || null; },
    rangePx() { return (canvas?.dimensions?.size || 100) * 2; },
    // ----- HTML overlay buttons (work regardless of the active canvas layer) -----
    _overlay() {
        let el = document.getElementById("darksheet-node-overlay");
        if (!el) { el = document.createElement("div"); el.id = "darksheet-node-overlay"; document.body.appendChild(el); }
        return el;
    },
    _scheduled: false,
    schedule() { if (this._scheduled) return; this._scheduled = true; requestAnimationFrame(() => { this._scheduled = false; this.renderOverlay(); }); },
    renderOverlay() {
        const el = this._overlay();
        try {
            if (!canvas?.ready) { el.innerHTML = ""; return; }
            const notes = canvas?.scene?.notes;
            if (notes) {
            const gm = game.user.isGM;
            const owned = (canvas.tokens?.placeables || []).filter(t => t.actor?.isOwner);
            const r = this.rangePx();
            const m = canvas.stage.worldTransform;
            const rect = canvas.app.view.getBoundingClientRect();
            const seen = new Set();
            for (const noteDoc of notes) {
                const nd = this.nodeOf(noteDoc); if (!nd) continue;
                let vis = gm || owned.some(t => Math.hypot(t.center.x - noteDoc.x, t.center.y - noteDoc.y) <= r);
                if (!vis) continue;
                const def = this.getDef(nd.defId);
                const id = noteDoc.id; seen.add(id);
                let btn = el.querySelector(`[data-note-id="${id}"]`);
                if (!btn) { btn = this._makeButton(id); el.appendChild(btn); }
                if (btn._dsDragging) continue; // don't yank a button mid-drag
                const depleted = (nd.quantity ?? 0) <= 0;
                btn.classList.toggle("is-depleted", depleted);
                btn.classList.toggle("is-gm", gm);
                btn.dataset.tooltip = `${def?.name || "Node"}${depleted ? " (exhausted)" : ` - ${nd.quantity ?? 0} left`}${gm ? " - drag to move, right-click to delete" : ""}`;
                if (!btn.firstChild) btn.innerHTML = `<img alt=""><span class="darksheet-node-btn__q"></span>`;
                const imgEl = btn.querySelector("img");
                const src = def?.img || def?.markerImg || "modules/darksheet/icons/ore.svg";
                if (imgEl && imgEl.getAttribute("src") !== src) imgEl.setAttribute("src", src);
                const qEl = btn.querySelector(".darksheet-node-btn__q");
                if (qEl) qEl.textContent = nd.quantity ?? 0;
                const sx = rect.left + m.a * noteDoc.x + m.c * noteDoc.y + m.tx;
                const sy = rect.top + m.b * noteDoc.x + m.d * noteDoc.y + m.ty;
                this._place(btn, sx, sy);
            }
            el.querySelectorAll(".darksheet-node-btn").forEach(b => { if (!seen.has(b.dataset.noteId)) b.remove(); });
            } else {
                el.querySelectorAll(".darksheet-node-btn").forEach(b => b.remove());
            }
            DSHARVEST.render(el);
        } catch (e) { }
    },
    _place(btn, sx, sy) {
        btn.style.left = `${sx}px`;
        btn.style.top = `${sy}px`;
        btn.style.transform = `translate(-50%, -50%) scale(${Math.max(0.6, Math.min(1.4, canvas?.stage?.scale?.x || 1))})`;
    },
    _worldFromClient(cx, cy) {
        const rect = canvas.app.view.getBoundingClientRect();
        return canvas.stage.worldTransform.applyInverse(new PIXI.Point(cx - rect.left, cy - rect.top));
    },
    _makeButton(id) {
        const btn = document.createElement("div");
        btn.className = "darksheet-node-btn";
        btn.dataset.noteId = id;
        let downX = 0, downY = 0, moved = false;
        btn.addEventListener("contextmenu", async (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            if (!game.user.isGM) return;
            await this.deletePlacedNode(btn.dataset.noteId);
        });
        btn.addEventListener("pointerdown", (ev) => {
            if (ev.button !== 0) return;
            ev.preventDefault(); ev.stopPropagation();
            downX = ev.clientX; downY = ev.clientY; moved = false;
            btn._dsDragging = false;
            try { btn.setPointerCapture(ev.pointerId); } catch (e) {}
        });
        btn.addEventListener("pointermove", (ev) => {
            if (!btn.hasPointerCapture?.(ev.pointerId)) return;
            if (Math.hypot(ev.clientX - downX, ev.clientY - downY) < 4) return;
            moved = true;
            if (!game.user.isGM) return; // only GM repositions
            btn._dsDragging = true;
            this._place(btn, ev.clientX, ev.clientY);
        });
        btn.addEventListener("pointerup", async (ev) => {
            try { btn.releasePointerCapture(ev.pointerId); } catch (e) {}
            if (btn._dsDragging && game.user.isGM) {
                btn._dsDragging = false;
                const w = this._worldFromClient(ev.clientX, ev.clientY);
                const noteDoc = canvas?.scene?.notes?.get(btn.dataset.noteId);
                if (noteDoc) await noteDoc.update({ x: Math.round(w.x), y: Math.round(w.y) });
                return;
            }
            if (!moved) this.onClickNote(btn.dataset.noteId);
        });
        return btn;
    },
    async deletePlacedNode(noteId, { confirm = true } = {}) {
        if (!game.user.isGM) return ui.notifications.warn("Darksheet | Only the GM can delete map gathering nodes.");
        const noteDoc = canvas?.scene?.notes?.get(noteId);
        const nd = this.nodeOf(noteDoc);
        if (!noteDoc || !nd) return;
        const def = this.getDef(nd.defId);
        const name = def?.name || noteDoc.text || "gathering node";
        if (confirm) {
            const ok = await Dialog.confirm({
                title: "Delete map gathering node",
                content: `<p>Delete the placed <strong>${DSGEM.esc(name)}</strong> node from this scene?</p>`
            });
            if (!ok) return;
        }
        try {
            await noteDoc.delete();
        } catch (e) {
            try { await canvas?.scene?.deleteEmbeddedDocuments?.("Note", [noteId]); }
            catch (err) {
                console.warn("Darksheet | failed to delete map gathering node", err);
                return ui.notifications.error("Darksheet | Could not delete that map gathering node.");
            }
        }
        try { if (this._gatherDlg?.rendered) this._gatherDlg.close(); } catch (e) {}
        this.schedule();
        ui.notifications.info(`Darksheet | Deleted map node "${name}".`);
    },
    onClickNote(noteId) {
        const noteDoc = canvas?.scene?.notes?.get(noteId); if (!noteDoc) return;
        const nd = this.nodeOf(noteDoc); if (!nd) return;
        const def = this.getDef(nd.defId);
        if (!def) return ui.notifications.warn("Darksheet | This node's definition no longer exists.");
        const actor = game.user.character || canvas.tokens.controlled[0]?.actor || null;
        this.openGather(def, noteDoc, actor);
    },

    // ----- gathering -----
    gatherTimeLabel(def) {
        const n = Number(def.gatherValue) || 1, u = def.gatherUnit || "hours";
        return `${n} ${n === 1 && u.endsWith("s") ? u.slice(0, -1) : u}`;
    },
    checkLabel(def) { return DSGEM.composeCheck(def.skill, def.dc); },
    hasRequiredTool(actor, def) {
        if (!def.requiredItem?.name) return true;
        if (!actor) return false;
        const want = def.requiredItem.name.toLowerCase();
        return actor.items.some(i => (i.name || "").toLowerCase().includes(want));
    },
    openGather(def, note, actor) {
        // Only one gathering dialog at a time.
        if (this._gatherDlg?.rendered) { try { this._gatherDlg.bringToTop(); } catch (e) {} return; }
        const nd = this.nodeOf(note) || { quantity: def.richnessMax };
        const q = nd.quantity ?? 0;
        const max = Number(def.richnessMax) || q || 1;
        const pct = Math.max(0, Math.min(100, Math.round((q / max) * 100)));
        const depleted = q <= 0;
        const gm = game.user.isGM;
        const mats = (def.loot || []).map(l => {
            const hide = l.hidden && !gm;
            const name = hide ? "Unknown material" : DSGEM.esc(l.name);
            const img = hide ? "modules/darksheet/icons/ore.svg" : (l.img || "icons/commodities/materials/bowl-powder-blue.webp");
            const nameHtml = (!hide && l.uuid)
                ? `<a class="content-link dg-mat__name" data-link data-uuid="${l.uuid}">${name}</a>`
                : `<span class="dg-mat__name${hide ? " is-hidden" : ""}">${name}</span>`;
            const tag = (gm && l.hidden) ? `<span class="dg-mat__tag" data-tooltip="Hidden from players until gathered"><i class="fas fa-eye-slash"></i></span>` : "";
            const qty = (l.qty || 1) > 1 ? `<span class="dg-mat__qty">\u00D7${l.qty}</span>` : "";
            return `<div class="dg-mat"><img src="${img}">${nameHtml}${tag}${qty}<span class="dg-mat__pct">${l.chance ?? 100}%</span></div>`;
        }).join("") || `<div class="dg-empty">No materials defined.</div>`;
        const toolName = def.requiredItem?.name
            ? (def.requiredItem.uuid ? `<a class="content-link dg-stat__v" data-link data-uuid="${def.requiredItem.uuid}">${DSGEM.esc(def.requiredItem.name)}</a>` : `<span class="dg-stat__v">${DSGEM.esc(def.requiredItem.name)}</span>`)
            : "";
        const toolTile = def.requiredItem?.name
            ? `<div class="dg-stat dg-stat--wide"><i class="fas fa-screwdriver-wrench"></i><div class="dg-stat__t"><span class="dg-stat__l">Required tool</span>${toolName}</div></div>` : "";
        const content = `<div class="darksheet-gather">
            <div class="dg-head">
                <div class="dg-head__icon"><img src="${def.markerImg || def.img || "modules/darksheet/icons/ore.svg"}"></div>
                <div class="dg-head__txt"><span class="dg-title">${DSGEM.esc(def.name)}</span><span class="dg-sub">Resource Node</span></div>
            </div>
            <div class="dg-stats">
                ${DSGEM.flexibleCheckTile(def.skill, def.dc)}
                <div class="dg-stat"><i class="fas fa-hourglass-half"></i><div class="dg-stat__t"><span class="dg-stat__l">Per attempt</span><span class="dg-stat__v">${DSGEM.esc(this.gatherTimeLabel(def))}</span></div></div>
                ${toolTile}
            </div>
            <div class="dg-remaining ${depleted ? "is-depleted" : ""}">
                <div class="dg-remaining__top"><span>Remaining</span><span>${q} / ${max}</span></div>
                <div class="dg-bar"><div class="dg-bar__fill" style="width:${pct}%"></div></div>
            </div>
            <div class="dg-mats-title">Possible Materials</div>
            <div class="dg-mats">${mats}</div>
        </div>`;
        const buttons = {
            gather: { icon: '<i class="fas fa-hand-holding"></i>', label: depleted ? "Exhausted" : "Gather", callback: (html) => this.gather(def, note, actor, DSGEM.readFlexibleChoice(html)) }
        };
        if (gm) buttons.delete = { icon: '<i class="fas fa-trash"></i>', label: "Delete Map Node", callback: () => this.deletePlacedNode(note.id) };
        const dlg = new Dialog({
            title: `Gather: ${def.name}`,
            content,
            buttons,
            default: "gather",
            render: (html) => {
                const root = html?.[0] ?? html;
                root?.querySelectorAll?.(".content-link[data-uuid]").forEach(a => a.addEventListener("click", async (e) => {
                    e.preventDefault();
                    const doc = await fromUuid(a.dataset.uuid).catch(() => null);
                    doc?.sheet?.render(true);
                }));
            },
            close: () => { if (this._gatherDlg === dlg) this._gatherDlg = null; }
        }, { classes: ["darksheet-gather-dialog"], width: 340 });
        this._gatherDlg = dlg;
        dlg.render(true);
    },
    rollLoot(def) {
        // Each loot entry rolls independently against its chance%.
        const out = [];
        for (const l of (def.loot || [])) {
            const chance = Number(l.chance ?? 100);
            if (Math.random() * 100 < chance) out.push(l);
        }
        // If nothing hit but loot exists, grant the highest-chance entry as a fallback.
        if (!out.length && def.loot?.length) out.push([...def.loot].sort((a, b) => (b.chance ?? 0) - (a.chance ?? 0))[0]);
        return out;
    },
    async grant(actor, entries, multiplier = 1) {
        if (!actor) return [];
        const made = [];
        for (const e of entries) {
            const qty = (Number(e.qty) || 1) * multiplier;
            let data = null;
            if (e.uuid) { const doc = await fromUuid(e.uuid).catch(() => null); if (doc) { data = doc.toObject(); delete data._id; foundry.utils.setProperty(data, "flags.darksheet.sourceMaterialUuid", e.uuid); } }
            if (!data) data = { name: e.name || "Material", type: "loot", img: e.img || "icons/commodities/materials/bowl-powder-blue.webp", system: {} };
            await darksheetGrantStackableItem(actor, data, qty);
            made.push(`${qty}\u00D7 ${e.name || data.name}`);
        }
        return made;
    },
    async setNoteQuantity(noteDoc, q) {
        q = Math.max(0, q);
        if (game.user.isGM) { try { await noteDoc.update({ "flags.darksheet.node.quantity": q }); } catch (e) {} return; }
        // Players lack permission to edit the scene Note - ask a GM to apply it.
        game.socket.emit("module.darksheet", { type: "nodeDeplete", sceneId: noteDoc.parent?.id || canvas.scene?.id, noteId: noteDoc.id, quantity: q });
    },
    async _applyDeplete(sceneId, noteId, q) {
        const scene = game.scenes.get(sceneId);
        const noteDoc = scene?.notes?.get(noteId);
        if (noteDoc) { try { await noteDoc.update({ "flags.darksheet.node.quantity": Math.max(0, q) }); } catch (e) {} }
    },
    async gather(def, note, actor, chosenKey) {
        actor = actor || game.user.character || canvas.tokens.controlled[0]?.actor || null;
        if (!actor) return ui.notifications.warn("Darksheet | Select your token (or assign a character) before gathering.");
        const nd = this.nodeOf(note) || { quantity: def.richnessMax };
        if ((nd.quantity ?? 0) <= 0) return ui.notifications.warn(`Darksheet | ${def.name} is exhausted.`);
        if (!this.hasRequiredTool(actor, def)) return ui.notifications.warn(`Darksheet | You need ${def.requiredItem.name} to gather here.`);
        // "Flexible" uses the skill picked in the dialog's dropdown.
        let skillKey = def.skill;
        if (skillKey === "flexible") { skillKey = chosenKey || DSGEM.FLEX_DEFAULT; if (!skillKey) return; }
        // Roll the gathering check.
        let roll = null;
        const waiter = darksheetBeginRollSettleWait();
        try {
            const r = CONFIG?.DND5E?.skills?.[skillKey]
                ? await actor.rollSkill({ skill: skillKey, target: def.dc })
                : await actor.rollAbilityCheck({ ability: skillKey, target: def.dc });
            await waiter.wait(r);
            roll = darksheetExtractRoll(r);
        } catch (e) {
            waiter.cancel();
            const mod = DSGEM.abilityMod(actor, "str");
            roll = await new Roll(`1d20 + ${mod}`).evaluate();
            await darksheetShowRollAndWait(roll);
        }
        if (!roll) return;
        const total = darksheetRollTotal(roll);
        const die = roll.dice?.[0]?.total ?? roll.terms?.[0]?.total;
        const crit = die === 20, fumble = die === 1;
        const success = !fumble && total >= def.dc;
        let body, granted = [], deplete = 0;
        if (crit && success) { granted = await this.grant(actor, this.rollLoot(def), 2); deplete = 2; body = `<strong>Critical success!</strong> Harvested twice: ${granted.join(", ") || "nothing"}.`; }
        else if (success) { granted = await this.grant(actor, this.rollLoot(def), 1); deplete = 1; body = `<strong>Success.</strong> Harvested: ${granted.join(", ") || "nothing"}.`; }
        else if (fumble) { deplete = 2; body = `<strong>Critical failure.</strong> You gather nothing and the node loses 2 measures.`; }
        else { deplete = 0; body = `<strong>Failure.</strong> You gather nothing.`; }
        const newQ = Math.max(0, (nd.quantity ?? 0) - deplete);
        await this.setNoteQuantity(note, newQ);
        try {
            await Darksheet.postDarkscreenChat({ actor, title: "Gathering", icon: "fa-hand-holding", whisper: "",
                body: `<p><strong>${DSGEM.esc(actor.name)}</strong> gathers from <strong>${DSGEM.esc(def.name)}</strong> \u2014 <span class="${success ? "darkRollGreen" : "darkRollRed"}">${total}</span> vs DC ${def.dc}. ${body}</p><p style="opacity:.7">${def.name}: ${newQ} measures left.</p>` });
        } catch (e) { }
        this.schedule();
    }
};
try { window.DarksheetNodes = DSNODE; } catch (e) {}

// ===== Harvest spots on dead creatures (DSHARVEST) =====
// When "autoHarvestDead" is on, a dead NPC's token gets a temporary harvest node
// anchored to it (it follows the token). Clicking it opens a harvest dialog that
// rolls a check and grants the creature's possible crafting materials, depleting
// the node's measures. Node richness follows the Darker Dungeons size table.
const DSHARVEST = {
    MARKER: "modules/darksheet/icons/monster-grasp.svg",
    DC_BY_RARITY: { Common: 10, Uncommon: 12, Rare: 15, "Very rare": 18, Legendary: 20, Unique: 25 },
    // Node richness (total measures) by creature size: meagre 1-5 for normal
    // creatures, simple 10 for Huge, rich 100 for Gargantuan.
    SIZE_MEASURES: { tiny: 1, sm: 2, med: 3, lg: 5, huge: 10, grg: 100 },
    measuresFor(actor) { return this.SIZE_MEASURES[actor?.system?.traits?.size || "med"] ?? 3; },
    harvestOf(tokenDoc) { return tokenDoc?.flags?.darksheet?.harvest || tokenDoc?.document?.flags?.darksheet?.harvest || null; },
    // Singular body parts come in limited numbers (one heart, a pair of eyes, etc.).
    // Bulk parts (scales, hide, blood, dust, etc.) are effectively unlimited.
    LIMITED_RE: /\b(heart|brain|core|soul|liver|gland|stinger|skull|tongue|crown|essence|spark|sac|horn|eye|fang)\b/i,
    limitFor(name) { return this.LIMITED_RE.test(name || "") ? 1 : null; },
    toLoot(mm, weight) {
        const rarity = DSLOOT.RAR_MAP[mm.properties.rarity] || "common";
        const substance = String(mm.properties.substance || "").toLowerCase();
        const element = String(mm.properties.element || "none").toLowerCase();
        return { name: mm.name, img: mm.icon, qty: 1, weight, limit: this.limitFor(mm.name), desc: mm.description, mat: { rarity, substance, element } };
    },
    // Entries still obtainable given what's already been taken from this corpse.
    availableEntries(def, taken) {
        return (def.loot || []).filter(l => l.limit == null || (taken?.[l.name] || 0) < l.limit);
    },
    // Pick one entry, weighted by its `weight` (so two equal weights -> 50/50).
    weightedPick(entries) {
        const total = entries.reduce((s, e) => s + Math.max(0, Number(e.weight) || 0), 0);
        if (total <= 0) return entries[0] || null;
        let r = Math.random() * total;
        for (const e of entries) { r -= Math.max(0, Number(e.weight) || 0); if (r <= 0) return e; }
        return entries[entries.length - 1] || null;
    },
    // One weighted pick per harvested measure, respecting per-item limits across
    // the picks in this single harvest (plus what was taken earlier).
    pickMeasures(def, taken, count) {
        const picks = [], local = { ...(taken || {}) };
        for (let i = 0; i < count; i++) {
            const avail = this.availableEntries(def, local);
            if (!avail.length) break;
            const e = this.weightedPick(avail);
            if (!e) break;
            picks.push(e);
            local[e.name] = (local[e.name] || 0) + 1;
        }
        return picks;
    },
    // A harvest "def": its loot entries are POSSIBLE material types rolled per
    // measure (1-2 from the monster JSON, plus a CR-appropriate generic).
    async defFor(tokenDoc) {
        const actor = tokenDoc.actor;
        if (!actor) return null;
        const json = await DSLOOT.load(); if (!json) return null;
        const hv = this.harvestOf(tokenDoc) || {};
        const type = DSLOOT.creatureType(actor);
        const cr = actor.system?.details?.cr;
        const rarLabel = DSLOOT.rarityForCR(cr);
        const mon = DSLOOT.matchMonster(json, actor.name || tokenDoc.name);
        let loot = Array.isArray(hv.loot) && hv.loot.length ? foundry.utils.deepClone(hv.loot) : [];
        if (!loot.length) {
            if (mon) for (const mm of (mon.materials || [])) loot.push(this.toLoot(mm, 100));
            const gen = DSLOOT.genericFor(json, type, rarLabel) || DSLOOT.genericFor(json, type, "Common");
            if (gen) loot.push(this.toLoot(gen, mon ? 50 : 100));
        }
        return { name: actor.name || tokenDoc.name, type, cr, skill: "flexible", dc: this.DC_BY_RARITY[rarLabel] || 12, loot, matched: hv.matched ?? !!mon, markerImg: this.MARKER };
    },
    render(el) {
        try {
            if (!canvas?.ready) return;
            const gm = game.user.isGM;
            const owned = (canvas.tokens?.placeables || []).filter(t => t.actor?.isOwner);
            const r = DSNODE.rangePx();
            const m = canvas.stage.worldTransform;
            const rect = canvas.app.view.getBoundingClientRect();
            const seen = new Set();
            for (const tok of (canvas.tokens?.placeables || [])) {
                const hv = this.harvestOf(tok.document); if (!hv) continue;
                if ((hv.measures ?? 0) <= 0) continue;
                const vis = gm || (tok.visible && owned.some(o => Math.hypot(o.center.x - tok.center.x, o.center.y - tok.center.y) <= r));
                if (!vis) continue;
                const id = tok.id; seen.add(id);
                let btn = el.querySelector(`.darksheet-harvest-btn[data-token-id="${id}"]`);
                if (!btn) { btn = this._makeButton(id); el.appendChild(btn); }
                btn.dataset.tooltip = `${escapeSheetHtml(hv.name || "Corpse")} - ${hv.measures ?? 0} left`;
                if (!btn.firstChild) btn.innerHTML = `<img alt=""><span class="darksheet-node-btn__q"></span>`;
                const img = btn.querySelector("img"); if (img && img.getAttribute("src") !== this.MARKER) img.setAttribute("src", this.MARKER);
                const q = btn.querySelector(".darksheet-node-btn__q"); if (q) q.textContent = hv.measures ?? 0;
                // Anchor to the token's lower-right so the corpse art stays visible.
                const cx = tok.center.x + (tok.w / 2) * 0.55;
                const cy = tok.center.y + (tok.h / 2) * 0.55;
                const sx = rect.left + m.a * cx + m.c * cy + m.tx;
                const sy = rect.top + m.b * cx + m.d * cy + m.ty;
                DSNODE._place(btn, sx, sy);
            }
            el.querySelectorAll(".darksheet-harvest-btn").forEach(b => { if (!seen.has(b.dataset.tokenId)) b.remove(); });
        } catch (e) { }
    },
    _makeButton(id) {
        const btn = document.createElement("div");
        btn.className = "darksheet-harvest-btn";
        btn.dataset.tokenId = id;
        btn.addEventListener("pointerdown", (ev) => { if (ev.button === 0) { ev.preventDefault(); ev.stopPropagation(); } });
        btn.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); this.onClick(id); });
        return btn;
    },
    onClick(tokenId) {
        const tok = canvas.tokens?.get(tokenId); if (!tok) return;
        const actor = game.user.character || canvas.tokens.controlled[0]?.actor || null;
        this.openHarvest(tok.document, actor);
    },
    async openHarvest(tokenDoc, actor) {
        if (this._dlg?.rendered) { try { this._dlg.bringToTop(); } catch (e) {} return; }
        const def = await this.defFor(tokenDoc);
        if (!def) return ui.notifications.warn("Darksheet | No harvest data for this creature.");
        const hv = this.harvestOf(tokenDoc) || { measures: 0 };
        const q = hv.measures ?? 0, max = hv.max ?? q ?? 1;
        const pct = Math.max(0, Math.min(100, Math.round((q / max) * 100)));
        const depleted = q <= 0;
        // Chances are weights: each measure grants ONE material, so the displayed
        // % is each entry's share of the still-available pool.
        const taken = hv.taken || {};
        const avail = this.availableEntries(def, taken);
        const totalW = avail.reduce((s, e) => s + Math.max(0, Number(e.weight) || 0), 0) || 1;
        const mats = (def.loot || []).map(l => {
            const img = l.img || "icons/commodities/materials/bowl-powder-blue.webp";
            const tag = `${DSGEM.esc((l.mat?.rarity || "").replace("veryRare", "very rare"))} ${DSGEM.esc(l.mat?.substance || "")}`.trim();
            const used = taken[l.name] || 0;
            const exhausted = l.limit != null && used >= l.limit;
            const share = exhausted ? 0 : Math.round((Math.max(0, Number(l.weight) || 0) / totalW) * 100);
            const limitTxt = l.limit != null ? `<span class="dg-mat__limit">${exhausted ? "depleted" : `${l.limit - used} of ${l.limit} left`}</span>` : "";
            return `<div class="dg-mat${exhausted ? " is-depleted" : ""}"><img src="${img}"><span class="dg-mat__name">${DSGEM.esc(l.name)}<span class="dg-mat__sub"> - ${tag}</span>${limitTxt}</span><span class="dg-mat__pct">${share}%</span></div>`;
        }).join("") || `<div class="dg-empty">Nothing harvestable.</div>`;
        const checkTile = DSGEM.flexibleCheckTile(def.skill, def.dc);
        const content = `<div class="darksheet-gather">
            <div class="dg-head">
                <div class="dg-head__icon"><img src="${def.markerImg}"></div>
                <div class="dg-head__txt"><span class="dg-title">${DSGEM.esc(def.name)}</span><span class="dg-sub">${def.matched ? "Harvestable remains" : "Remains"}</span></div>
            </div>
            <div class="dg-stats">
                ${checkTile}
                <div class="dg-stat"><i class="fas fa-paw"></i><div class="dg-stat__t"><span class="dg-stat__l">Creature</span><span class="dg-stat__v">${DSGEM.esc(def.type || "-")}</span></div></div>
            </div>
            <div class="dg-remaining ${depleted ? "is-depleted" : ""}">
                <div class="dg-remaining__top"><span>Remaining</span><span>${q} / ${max}</span></div>
                <div class="dg-bar"><div class="dg-bar__fill" style="width:${pct}%"></div></div>
            </div>
            <div class="dg-mats-title">Possible Materials</div>
            <div class="dg-mats">${mats}</div>
        </div>`;
        const dlg = new Dialog({
            title: `Harvest: ${def.name}`,
            content,
            buttons: { harvest: { icon: '<i class="fas fa-hand-holding"></i>', label: depleted ? "Picked clean" : "Harvest", callback: (html) => this.harvest(tokenDoc, def, actor, DSGEM.readFlexibleChoice(html)) } },
            default: "harvest",
            close: () => { if (this._dlg === dlg) this._dlg = null; }
        }, { classes: ["darksheet-gather-dialog"], width: 340 });
        this._dlg = dlg;
        dlg.render(true);
    },
    async grant(actor, entries, multiplier = 1) {
        if (!actor) return [];
        const made = [];
        for (const e of entries) {
            const qty = (Number(e.qty) || 1) * multiplier;
            const data = {
                name: e.name || "Material", type: "loot", img: e.img || "icons/commodities/materials/bowl-powder-blue.webp",
                system: { quantity: qty, identified: true, description: { value: `<p><em>Harvested crafting material.</em></p><p>${e.desc || ""}</p>`, chat: "" } },
                flags: { darksheet: { material: e.mat || { rarity: "common", substance: "flesh", element: "none" }, srdMat: { kind: "harvest" } } }
            };
            await darksheetGrantStackableItem(actor, data, qty);
            made.push(`${qty}\u00D7 ${e.name || data.name}`);
        }
        return made;
    },
    // Players can't edit an enemy token's flags - relay measures + taken to the GM.
    async setHarvest(tokenDoc, measures, taken) {
        const m = Math.max(0, measures);
        if (game.user.isGM) { try { await tokenDoc.update({ "flags.darksheet.harvest.measures": m, "flags.darksheet.harvest.taken": taken || {} }); } catch (e) {} return; }
        game.socket.emit("module.darksheet", { type: "harvestDeplete", sceneId: tokenDoc.parent?.id || canvas.scene?.id, tokenId: tokenDoc.id, measures: m, taken: taken || {} });
    },
    async _applyDeplete(sceneId, tokenId, measures, taken) {
        const tokenDoc = game.scenes.get(sceneId)?.tokens?.get(tokenId);
        if (tokenDoc) { try { await tokenDoc.update({ "flags.darksheet.harvest.measures": Math.max(0, measures), "flags.darksheet.harvest.taken": taken || {} }); } catch (e) {} }
    },
    async harvest(tokenDoc, def, actor, chosenKey) {
        actor = actor || game.user.character || canvas.tokens.controlled[0]?.actor || null;
        if (!actor) return ui.notifications.warn("Darksheet | Select your token (or assign a character) before harvesting.");
        const hv = this.harvestOf(tokenDoc) || { measures: 0 };
        if ((hv.measures ?? 0) <= 0) return ui.notifications.warn(`Darksheet | ${def.name} has been picked clean.`);
        // "Flexible" uses the skill picked in the dialog's dropdown.
        let skillKey = def.skill;
        if (skillKey === "flexible") { skillKey = chosenKey || DSGEM.FLEX_DEFAULT; if (!skillKey) return; }
        let roll = null;
        const waiter = darksheetBeginRollSettleWait();
        try {
            const r = CONFIG?.DND5E?.skills?.[skillKey]
                ? await actor.rollSkill({ skill: skillKey, target: def.dc })
                : await actor.rollAbilityCheck({ ability: skillKey, target: def.dc });
            await waiter.wait(r);
            roll = darksheetExtractRoll(r);
        } catch (e) {
            waiter.cancel();
            roll = await new Roll(`1d20 + ${DSGEM.abilityMod(actor, "wis")}`).evaluate();
            await darksheetShowRollAndWait(roll);
        }
        if (!roll) return;
        const total = darksheetRollTotal(roll);
        const die = roll.dice?.[0]?.total ?? roll.terms?.[0]?.total;
        const crit = die === 20, fumble = die === 1;
        const success = !fumble && total >= def.dc;
        // Each harvested measure is one weighted pick; chances act as weights.
        const taken = { ...(hv.taken || {}) };
        let body, granted = [], deplete = 0, count = 0;
        if (crit && success) { count = 2; deplete = 2; }
        else if (success) { count = 1; deplete = 1; }
        else if (fumble) { deplete = 2; }
        const picks = count ? this.pickMeasures(def, taken, count) : [];
        if (picks.length) {
            const merged = {};
            for (const p of picks) { (merged[p.name] = merged[p.name] || { ...p, qty: 0 }).qty += (Number(p.qty) || 1); taken[p.name] = (taken[p.name] || 0) + 1; }
            granted = await this.grant(actor, Object.values(merged));
        }
        if (crit && success) body = `<strong>Critical success!</strong> Harvested: ${granted.join(", ") || "nothing"}.`;
        else if (success) body = `<strong>Success.</strong> Harvested: ${granted.join(", ") || "nothing"}.`;
        else if (fumble) body = `<strong>Critical failure.</strong> You spoil part of the remains (lose 2 measures).`;
        else body = `<strong>Failure.</strong> You harvest nothing.`;
        const newQ = Math.max(0, (hv.measures ?? 0) - deplete);
        await this.setHarvest(tokenDoc, newQ, taken);
        try {
            await Darksheet.postDarkscreenChat({ actor, title: "Harvesting", icon: "fa-hand-holding", whisper: "",
                body: `<p><strong>${DSGEM.esc(actor.name)}</strong> harvests <strong>${DSGEM.esc(def.name)}</strong> \u2014 <span class="${success ? "darkRollGreen" : "darkRollRed"}">${total}</span> vs DC ${def.dc}. ${body}</p><p style="opacity:.7">${newQ} measure(s) left.</p>` });
        } catch (e) {}
        DSNODE.schedule();
        if (newQ <= 0 && this._dlg?.rendered) { try { this._dlg.close(); } catch (e) {} }
    }
};
try { window.DarksheetHarvest = DSHARVEST; } catch (e) {}

Hooks.once("init", () => {
    try { game.settings.register("darksheet", "nodes", { scope: "world", config: false, type: Array, default: [] }); } catch (e) {}
    try { game.settings.register("darksheet", "nodesSeeded", { scope: "world", config: false, type: Boolean, default: false }); } catch (e) {}
    try {
        game.settings.register("darksheet", "autoHarvestDead", {
            name: "Auto harvest spots on dead creatures",
            hint: "When an NPC drops to 0 HP, attach a harvestable spot to its token (it moves with the token). Players near the body can harvest crafting materials; node richness scales with creature size.",
            scope: "world", config: true, type: Boolean, default: false
        });
    } catch (e) {}
});

// Seed the standard gathering nodes once, after compendiums are loaded (GM only).
Hooks.once("ready", () => { try { DSNODE.seedDefaults(); } catch (e) { console.warn("Darksheet | node seeding failed", e); } });

// Attach/remove a harvest spot as creatures die or revive (GM applies, once).
Hooks.on("updateActor", async (actor, change) => {
    try {
        if (!game.settings.get("darksheet", "autoHarvestDead")) return;
        if (!(game.users?.activeGM?.isSelf ?? game.user.isGM)) return;
        const hp = foundry.utils.getProperty(change, "system.attributes.hp.value");
        if (hp === undefined) return;
        const tokens = actor.isToken
            ? (actor.token ? [actor.token] : [])
            : (actor.getActiveTokens?.(false, true) || []).map(t => t.document ?? t);
        if (hp > 0) {
            for (const td of tokens) if (td.getFlag?.("darksheet", "harvest")) { try { await td.unsetFlag("darksheet", "harvest"); } catch (e) {} }
            return;
        }
        if (actor.type !== "npc") return;
        const measures = DSHARVEST.measuresFor(actor);
        for (const td of tokens) {
            if (td.getFlag?.("darksheet", "harvest")) continue;
            try { await td.setFlag("darksheet", "harvest", { measures, max: measures, name: actor.name }); } catch (e) {}
        }
    } catch (e) { }
});
// Overlay node buttons follow the canvas (pan/zoom), tokens (proximity), and node edits.
for (const h of ["canvasReady", "canvasPan", "canvasTearDown", "controlToken", "refreshToken",
    "createNote", "updateNote", "deleteNote", "updateScene",
    "createToken", "updateToken", "deleteToken"]) {
    Hooks.on(h, () => DSNODE.schedule());
}
// Hide a placed node Note's native rendering - the HTML overlay marker is the
// only visual; the Note is just the data/position anchor.
for (const h of ["drawNote", "refreshNote"]) {
    Hooks.on(h, (note) => { try { if (DSNODE.nodeOf(note?.document)) { note.renderable = false; note.visible = false; } } catch (e) {} });
}
// Node definitions live in a world setting - refresh markers when they change
// (e.g. a GM swaps the marker icon) for every connected client.
Hooks.on("updateSetting", (setting) => { if (setting?.key === "darksheet.nodes") DSNODE.schedule(); });
// Drag a node from the Darkscreen onto the canvas.
Hooks.on("dropCanvasData", (cv, data) => {
    if (data?.type !== "darksheet-node" || !data.defId) return;
    DSNODE.placeOnScene(canvas.scene, data.defId, data.x, data.y);
    return false;
});

// Colour each inventory row's price by its currency denomination (pp/gp/ep/sp/cp).
function darksheetColorInventoryPrices(app, html) {
    try {
        const actor = app?.actor; if (!actor) return;
        const root = html instanceof jQuery ? html[0] : html; if (!root) return;
        const CUR = ["pp", "gp", "ep", "sp", "cp"];
        const classes = CUR.map(c => "darksheet-price-" + c);
        root.querySelectorAll("[data-item-id] .item-price").forEach(el => {
            const li = el.closest("[data-item-id]");
            const it = li ? actor.items.get(li.dataset.itemId) : null;
            let denom = it ? String(it.system?.price?.denomination || "").toLowerCase() : "";
            if (!CUR.includes(denom)) {
                const m = (el.textContent || "").match(/\b(pp|gp|ep|sp|cp)\b/i);
                denom = m ? m[1].toLowerCase() : "";
            }
            el.classList.remove(...classes);
            if (CUR.includes(denom)) el.classList.add("darksheet-price-" + denom);
        });
    } catch (e) { console.warn("Darksheet | price colouring failed", e); }
}

// Darker Dungeons allows up to 3 inspiration points. The 5e character sheet's
// inspiration control is a single fancy diamond button (`button.inspiration`,
// background ui/inspiration.webp, lit via aria-pressed) absolutely positioned in
// `.sheet-header > .right`, just right of the level badge. We CLONE that native
// element three times so the styling matches the system exactly, bind the clones
// to flags.darksheet.inspiration, and stack them (right of the level, downward).
// The core boolean stays in sync so the rest of dnd5e still sees inspiration.
const DARKSHEET_MAX_INSPIRATION = 3;
function darksheetInjectInspiration(app, html) {
    try {
        const actor = app?.actor;
        if (actor?.type !== "character") return;
        const root = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        if (!root) return;
        const native = root.querySelector('.inspiration[data-action="toggleInspiration"]') || root.querySelector("button.inspiration");
        if (!native) return;
        const parent = native.parentElement;
        if (!parent || parent.querySelector(".darksheet-inspiration")) return;
        const max = DARKSHEET_MAX_INSPIRATION;
        const count = Math.max(0, Math.min(max, Number(actor.getFlag("darksheet", "inspiration")) || 0));
        const wrap = document.createElement("div");
        wrap.className = "darksheet-inspiration";
        wrap.dataset.tooltip = "Darker Dungeons Inspiration (0\u20133)";
        for (let i = 0; i < max; i++) {
            const pip = native.cloneNode(true); // reuse the system's fancy diamond
            pip.classList.add("darksheet-insp");
            pip.removeAttribute("data-action");
            pip.dataset.dsI = String(i);
            pip.setAttribute("aria-pressed", i < count ? "true" : "false");
            pip.setAttribute("aria-label", `Darker Dungeons Inspiration ${i + 1}`);
            pip.setAttribute("data-tooltip", `Inspiration ${i + 1}`);
            pip.addEventListener("click", async (ev) => {
                ev.preventDefault(); ev.stopPropagation();
                const cur = Math.max(0, Math.min(max, Number(actor.getFlag("darksheet", "inspiration")) || 0));
                // Click the top filled diamond to spend one; an empty one fills up to it.
                const next = (cur === i + 1) ? i : (i + 1);
                await actor.update({ "flags.darksheet.inspiration": next, "system.attributes.inspiration": next > 0 });
            });
            wrap.appendChild(pip);
        }
        native.replaceWith(wrap);
    } catch (e) { /* header layout differs - leave the native control */ }
}

// Inject Cut/Grind/Craft buttons onto gem rows in the character inventory.
function darksheetInjectGemButtons(app, html) {
    try {
        const actor = app?.actor; if (!actor) return;
        const root = html instanceof jQuery ? html[0] : html; if (!root) return;
        for (const it of actor.items) {
            const g = it.flags?.darksheet?.gem;
            const d = it.flags?.darksheet?.dust;
            if (!g && !d) continue;
            const row = root.querySelector(`[data-item-id="${it.id}"]`); if (!row) continue;
            const controls = row.querySelector(".item-controls"); if (!controls) continue;
            if (controls.querySelector(".darksheet-gem-row-btn")) continue;
            const defs = g ? DSGEM.buttonsFor(g) : DSGEM.buttonsForDust(d); if (!defs.length) continue;
            const frag = document.createDocumentFragment();
            for (const d of defs) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "unbutton item-control darksheet-gem-row-btn";
                b.dataset.gemAction = d.action;
                b.dataset.tooltip = d.label;
                b.setAttribute("aria-label", d.label);
                b.innerHTML = `<i class="fas ${d.icon}" inert></i>`;
                b.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); DSGEM.run(d.action, actor, it); });
                frag.append(b);
            }
            controls.prepend(frag);
        }
    } catch (e) { console.warn("Darksheet | gem button injection failed", e); }
}

async function loadItemData(app, html, data) {
    console.log("Loading Darksheet item data...");
    const item = app?.item ?? app?.document ?? data?.item;
    if (!item) return;
    if (item.type === "spell" || item.type === "feat" || item.type === "class") return; //DISABLE SPELL AND FEATURES
    await darksheetDefaultItemPriceDenomination(item);

    data.item ??= item;
    const matFlag = item.flags?.darksheet?.material;
    data.darkSockets = darksheetSocketDisplay(item);
    // Hide the socket field on sheets with no sockets - but keep it for the GM so
    // they can still grant sockets to an otherwise socketless item.
    data.showSocketField = game.user.isGM || !!data.darkSockets;
    data.qualityValue = darksheetQualityValue(item);
    data.NotEditable = !isDarkSheetItemEditable(app, html, data);
    const canEditOwnedMaterialFields = !!matFlag && (item.isOwner ?? game.user?.isGM);
    data.MaterialFieldsLocked = data.NotEditable && !canEditOwnedMaterialFields;
    data.DarksheetItemFieldsLocked = data.NotEditable && !canEditOwnedMaterialFields;
    // Gem/dust actions (Cut / Grind / Craft Jewel / Craft Oil) - only on an actor.
    const gemFlag = item.flags?.darksheet?.gem;
    const dustFlag = item.flags?.darksheet?.dust;
    if (item.actor) {
        const buttons = gemFlag ? DSGEM.buttonsFor(gemFlag) : dustFlag ? DSGEM.buttonsForDust(dustFlag) : [];
        if (buttons.length) data.gemActions = { buttons };
    }
    // Material property panel (crafting materials).
    if (matFlag) {
        data.material = DSGEM.materialInfo(matFlag);
        const frag = item.flags?.darksheet?.item?.fragility;
        if (frag) data.material.fragilityLabel = `${DSGEM.fragilityLabel(frag)} (${frag})`;
        data.matRarities = DSGEM.MAT_RARITIES;
        data.substances = DSGEM.SUBSTANCES;
        data.elements = DSGEM.ELEMENTS;
    }
    // Recipe crafting panel (recipe items). Offer "Make Recipe" on plain non-material items.
    const recipeFlag = matFlag ? null : item.flags?.darksheet?.recipe;
    if (recipeFlag) {
        data.blueprint = DSGEM.blueprintInfo(recipeFlag);
        data.checkOptions = DSGEM.checkOptions();
        data.dcOptions = DSGEM.dcOptions();
        data.timeUnits = DSGEM.timeUnits();
        data.matRarities = DSGEM.MAT_RARITIES;
        data.substances = DSGEM.SUBSTANCES;
        data.elements = DSGEM.ELEMENTS;
        data.canListMaterials = game.user.isGM;
    } else if (!matFlag) {
        // If a recipe that produces this item already exists, offer to VIEW it
        // (a cached index keeps this cheap); otherwise let the GM make one.
        const existing = await DSGEM.recipesForItem(item);
        if (existing.length) data.viewRecipes = existing;
        else if (game.user.isGM) data.canMakeRecipe = true;
    }
    // Offer "Make this a Material" on loot/consumable items (GM) - only those make
    // sense as crafting materials.
    if (game.user.isGM && !matFlag && !recipeFlag && !gemFlag && !dustFlag && !item.flags?.darksheet?.jewel
        && (item.type === "loot" || item.type === "consumable")) data.canMakeMaterial = true;
    let itemDataTemplate = await darksheetRenderTemplate("modules/darksheet/templates/itemdata.html", data);

    const roots = [];
    if (html instanceof jQuery) roots.push(...html.toArray());
    else if (html instanceof HTMLElement) roots.push(html);
    if (app?.element instanceof HTMLElement) roots.push(app.element);
    else if (app?.element instanceof jQuery) roots.push(...app.element.toArray());
    else if (app?.element?.[0] instanceof HTMLElement) roots.push(app.element[0]);

    for (const root of new Set(roots.filter(Boolean))) root.querySelector?.('.darksheet-item-data')?.remove();

    const root = roots.find(el => el?.querySelector?.('.sheet-header') || el?.matches?.('.sheet-header'));
    const header = root?.matches?.('.sheet-header') ? root : root?.querySelector?.('.sheet-header');
    if (header) header.insertAdjacentHTML('afterend', itemDataTemplate);
    else html.find('.item-properties').first().before(itemDataTemplate);
    darksheetApplySilverStandardPriceControls(app, html);
    // Collapsible "Darker Dungeons" section - remember open/closed across re-renders.
    try {
        const rootEl = app?.element instanceof HTMLElement ? app.element
            : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        const details = rootEl?.querySelector?.('details.darksheet-item-data');
        if (details) {
            if (localStorage.getItem('darksheet-dd-open') === '0') details.open = false;
            details.addEventListener('toggle', () => {
                try { localStorage.setItem('darksheet-dd-open', details.open ? '1' : '0'); } catch (e) {}
            });
        }
    } catch (e) {}
    // Socket clicks are actions (dialog + roll), not form edits - wire them for
    // any owner, even in dnd5e v14 "play mode" where NotEditable is true.
    if (data.darkSockets && (item.isOwner ?? !data.NotEditable)) wireItemSocketClicks(app, item);
    // Wire the gem action buttons (Cut / Grind / Craft) on the item sheet.
    if (data.gemActions && item.actor) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        rootEl?.querySelectorAll?.('.darksheet-gem-btn[data-gem-action]')?.forEach(btn => {
            btn.addEventListener('click', (ev) => { ev.preventDefault(); DSGEM.run(btn.dataset.gemAction, item.actor, item); });
        });
    }
    // "Make a recipe for this item" - create a NEW recipe whose output is this item.
    if (data.canMakeRecipe) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        rootEl?.querySelector?.('[data-action="make-recipe"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            await darksheetCreateRecipeItem({ resultItem: item, parent: item.actor ?? null });
        });
    }
    // "View recipe" - open the existing recipe(s) that craft this item.
    if (data.viewRecipes?.length) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        rootEl?.querySelectorAll?.('[data-action="view-recipe"]')?.forEach(btn => btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const doc = await fromUuid(btn.dataset.recipeUuid).catch(() => null);
            if (doc?.sheet) doc.sheet.render(true);
            else ui.notifications.warn("Darksheet | That recipe could not be opened.");
        }));
    }
    // "Make this a Material" - tag the loot item with default material properties.
    if (data.canMakeMaterial) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        rootEl?.querySelector?.('[data-action="make-material"]')?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            await item.setFlag("darksheet", "material", { rarity: "common", substance: "metal", element: "none" });
        });
    }
    // Make recipe result/material links open their item on click (hover preview is
    // handled by Foundry's content-link delegation).
    if (data.blueprint) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        rootEl?.querySelectorAll?.('.darksheet-blueprint a.content-link[data-uuid]')?.forEach(a => {
            a.addEventListener('click', async (ev) => {
                ev.preventDefault();
                const doc = await fromUuid(a.dataset.uuid).catch(() => null);
                doc?.sheet?.render(true);
            });
        });
        // GM: list each requirement and which compendium materials satisfy it.
        rootEl?.querySelector?.('[data-action="recipe-materials"]')?.addEventListener('click', (ev) => {
            ev.preventDefault();
            DSGEM.showRecipeMaterials(item);
        });
    }
    // Recipe edit-mode widgets: per-output (variant) editing.
    if (data.blueprint && item.flags?.darksheet?.recipe && !data.NotEditable) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? (html instanceof jQuery ? html[0] : html));
        const readDrop = (ev) => {
            let dd = null;
            try { dd = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch (e) {}
            return dd?.uuid || (dd?.type === "Item" && dd?.id ? `Item.${dd.id}` : null);
        };
        const getVars = () => foundry.utils.deepClone(item.flags?.darksheet?.recipe?.variants ?? []);
        const saveVars = (v) => item.update({ "flags.darksheet.recipe.variants": v });
        const vIndex = (el) => Number(el.closest('[data-variant-index]')?.dataset.variantIndex);
        // restore select values (can't bind nested-array selects by name)
        rootEl?.querySelectorAll?.('select[data-current]')?.forEach(s => { s.value = s.dataset.current ?? ""; });
        // Add / remove outputs.
        rootEl?.querySelector?.('[data-var-add]')?.addEventListener('click', async (ev) => {
            ev.preventDefault(); const v = getVars(); v.push(DSGEM.blankVariant()); await saveVars(v);
        });
        rootEl?.querySelectorAll?.('[data-var-rm]')?.forEach(btn => btn.addEventListener('click', async (ev) => {
            ev.preventDefault(); const i = vIndex(btn); const v = getVars(); if (i < 0 || i >= v.length) return; v.splice(i, 1); await saveVars(v);
        }));
        // Result item drop per output.
        rootEl?.querySelectorAll?.('[data-var-drop]')?.forEach(drop => {
            drop.addEventListener('dragover', (ev) => { ev.preventDefault(); drop.classList.add('is-dragover'); });
            drop.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
            drop.addEventListener('drop', async (ev) => {
                ev.preventDefault(); drop.classList.remove('is-dragover');
                const uuid = readDrop(ev); if (!uuid) return ui.notifications.warn("Darksheet | Drop an item to link the crafted result.");
                const doc = await fromUuid(uuid).catch(() => null); if (!doc) return;
                const i = vIndex(drop); const v = getVars(); if (!v[i]) return;
                v[i].result = doc.name; v[i].resultUuid = uuid; v[i].resultImg = doc.img; await saveVars(v);
            });
        });
        // Materials drop per output.
        rootEl?.querySelectorAll?.('[data-var-matdrop]')?.forEach(md => {
            md.addEventListener('dragover', (ev) => { ev.preventDefault(); md.classList.add('is-dragover'); });
            md.addEventListener('dragleave', () => md.classList.remove('is-dragover'));
            md.addEventListener('drop', async (ev) => {
                ev.preventDefault(); md.classList.remove('is-dragover');
                const uuid = readDrop(ev); if (!uuid) return ui.notifications.warn("Darksheet | Drop an item to add it as a required material.");
                const doc = await fromUuid(uuid).catch(() => null); if (!doc) return;
                const i = vIndex(md); const v = getVars(); if (!v[i]) return;
                v[i].materials = Array.isArray(v[i].materials) ? v[i].materials : [];
                const existing = v[i].materials.find(m => m.uuid === uuid);
                if (existing) existing.qty = Number(existing.qty || 1) + 1;
                else v[i].materials.push({ uuid, name: doc.name, img: doc.img, qty: 1 });
                await saveVars(v);
            });
        });
        // Add a material-type requirement (any item matching rarity/substance/element).
        rootEl?.querySelectorAll?.('[data-var-mataddtype]')?.forEach(btn => btn.addEventListener('click', async (ev) => {
            ev.preventDefault(); const i = vIndex(btn); const v = getVars(); if (!v[i]) return;
            v[i].materials = Array.isArray(v[i].materials) ? v[i].materials : [];
            v[i].materials.push({ match: { rarity: "", substance: "", element: "" }, qty: 1 });
            await saveVars(v);
        }));
        // Edit a type requirement's rarity / substance / element.
        const matMatchEdit = (sel, field) => sel.addEventListener('change', async () => {
            const vi = vIndex(sel); const mi = Number(sel.closest('[data-mat-index]')?.dataset.matIndex);
            const v = getVars(); const m = v[vi]?.materials?.[mi]; if (!m) return;
            m.match = m.match || { rarity: "", substance: "", element: "" };
            m.match[field] = sel.value; await saveVars(v);
        });
        rootEl?.querySelectorAll?.('[data-mat-rarity]')?.forEach(s => matMatchEdit(s, 'rarity'));
        rootEl?.querySelectorAll?.('[data-mat-substance]')?.forEach(s => matMatchEdit(s, 'substance'));
        rootEl?.querySelectorAll?.('[data-mat-element]')?.forEach(s => matMatchEdit(s, 'element'));
        // Material qty / remove per output.
        rootEl?.querySelectorAll?.('[data-mat-qty]')?.forEach(inp => inp.addEventListener('change', async () => {
            const vi = vIndex(inp); const mi = Number(inp.closest('[data-mat-index]')?.dataset.matIndex);
            const v = getVars(); if (!v[vi]?.materials?.[mi]) return;
            v[vi].materials[mi].qty = Math.max(1, Number(inp.value) || 1); await saveVars(v);
        }));
        rootEl?.querySelectorAll?.('[data-mat-rm]')?.forEach(btn => btn.addEventListener('click', async (ev) => {
            ev.preventDefault(); const vi = vIndex(btn); const mi = Number(btn.closest('[data-mat-index]')?.dataset.matIndex);
            const v = getVars(); if (!v[vi]?.materials || mi < 0 || mi >= v[vi].materials.length) return;
            v[vi].materials.splice(mi, 1); await saveVars(v);
        }));
        // Skill / DC / effect per output.
        rootEl?.querySelectorAll?.('[data-var-skill]')?.forEach(sel => sel.addEventListener('change', async () => {
            const i = vIndex(sel); const v = getVars(); if (!v[i]) return; v[i].checkSkill = sel.value; await saveVars(v);
        }));
        rootEl?.querySelectorAll?.('[data-var-dc]')?.forEach(sel => sel.addEventListener('change', async () => {
            const i = vIndex(sel); const v = getVars(); if (!v[i]) return; v[i].checkDc = sel.value ? Number(sel.value) : ""; await saveVars(v);
        }));
    }
    // wear visuals on the item sheet's header image
    const wear = darksheetWearInfo(item);
    if (wear) {
        const rootEl = app?.element instanceof HTMLElement ? app.element : (app?.element?.[0] ?? null);
        const sheetImg = rootEl?.querySelector(".sheet-header img, img.profile, img.profile-img, [data-edit='img'], img[data-action='editImage'], .document-img img, .header-details img");
        if (sheetImg) darksheetApplyWearTo(sheetImg, wear);
    }
}

function isDarkSheetItemEditable(app, html, data) {
    if (typeof data?.editable === "boolean") return data.editable;
    if (typeof app?.isEditable === "boolean") return app.isEditable;
    if (typeof app?.isEditMode === "boolean") return app.isEditMode;
    if (typeof data?.cssClass === "string") return data.cssClass.includes("editable");
    const root = html instanceof jQuery ? html[0] : html;
    return !!root?.classList?.contains("editable");
}

function applyWeaponInventoryQuantityVisibility(app, html) {
    const shouldHide = game.settings.get('darksheet', 'hideWeaponQuantityOnItemSheet');
    const roots = [];
    if (html instanceof jQuery) roots.push(...html.toArray());
    else if (html instanceof HTMLElement) roots.push(html);

    if (app?.element instanceof HTMLElement) roots.push(app.element);
    else if (app?.element instanceof jQuery) roots.push(...app.element.toArray());
    else if (app?.element?.[0] instanceof HTMLElement) roots.push(app.element[0]);

    for (const root of new Set(roots.filter(Boolean))) {
        const weaponSections = [];
        if (root.matches?.('.items-section[data-group-type="weapon"]')) weaponSections.push(root);
        weaponSections.push(...(root.querySelectorAll?.('.items-section[data-group-type="weapon"]') ?? []));

        for (const section of weaponSections) {
            section.querySelectorAll('.item-quantity').forEach(quantity => {
                quantity.classList.toggle('darksheet-hidden-weapon-quantity', shouldHide);
                if (shouldHide) quantity.setAttribute('aria-hidden', 'true');
                else quantity.removeAttribute('aria-hidden');
            });
        }
    }
}

function darksheetSheetRoot(sheet, html) {
    const roots = [];
    if (html instanceof jQuery) roots.push(...html.toArray());
    else if (html instanceof HTMLElement) roots.push(html);
    if (sheet?.element instanceof HTMLElement) roots.push(sheet.element);
    else if (sheet?.element instanceof jQuery) roots.push(...sheet.element.toArray());
    else if (sheet?.element?.[0] instanceof HTMLElement) roots.push(sheet.element[0]);
    return [...new Set(roots.filter(Boolean))].find(root => root?.querySelector?.("[data-application-part], .sheet-body")) ?? roots[0] ?? null;
}

function escapeSheetHtml(value) {
    const text = String(value ?? "");
    return foundry.utils.escapeHTML?.(text) ?? text.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function findWoundSheetTarget(root) {
    const selectors = [
        'section[data-application-part="details"] > .right',
        '.tab[data-tab="details"] > .right',
        'section[data-tab="details"] > .right',
        '[data-application-part="details"]',
        '.tab[data-tab="details"]',
        '.sheet-body .tab-body',
        '.sheet-body'
    ];
    for (const selector of selectors) {
        const target = root.matches?.(selector) ? root : root.querySelector?.(selector);
        if (target) return target;
    }
    return null;
}

function woundRowsHtml(woundlist, showOldWounds) {
    const active = woundlist
        .map((wound, index) => ({ wound, index }))
        .filter(({ wound }) => !wound.healed);
    const healed = woundlist
        .map((wound, index) => ({ wound, index }))
        .filter(({ wound }) => wound.healed);

    const activeRows = active.length
        ? active.map(({ wound, index }) => `
            <tr class="darksheet-wound-row" data-wound-index="${index}">
                <td><input type="text" data-wound-location="${index}" value="${escapeSheetHtml(wound.location || "")}" placeholder="Where is this wound?"></td>
                <td><input type="checkbox" data-wound-treated="${index}" ${wound.treated ? "checked" : ""} aria-label="Treated"></td>
                <td>${wound.treated ? '<span class="darksheet-wound-ok">Treated</span>' : '<span class="exhaustiontip">+1 Exh.</span>'}</td>
                <td><button type="button" class="removewoundbutton" data-wound-heal="${index}" title="Mark as healed"><i class="fa-solid fa-bandage"></i></button></td>
            </tr>
        `).join("")
        : `<tr class="darksheet-wound-empty"><td colspan="4">No active wounds.</td></tr>`;

    const oldRows = showOldWounds
        ? healed.map(({ wound, index }) => {
            const datesInfo = `Gained: ${wound.gainedDate || "Unknown"} | Healed: ${wound.healedDate || "Unknown"}`;
            return `
                <tr class="darksheet-wound-row darksheet-wound-row--healed" data-wound-index="${index}">
                    <td><input type="text" value="${escapeSheetHtml(wound.location || "")}" disabled></td>
                    <td><span>Healed</span></td>
                    <td><i class="fa-regular fa-circle-info woundInformation" title="${escapeSheetHtml(datesInfo)}"></i></td>
                    <td><button type="button" class="removewoundbutton" data-wound-delete="${index}" title="Delete old wound"><i class="fa-solid fa-xmark"></i></button></td>
                </tr>
            `;
        }).join("")
        : "";

    return `
        ${activeRows}
        <tr class="darksheet-old-wounds-toggle" data-wound-toggle-old>
            <td colspan="4">
                <span>Old Wounds / Scars</span>
                <i class="fas fa-angle-${showOldWounds ? "down" : "up"}"></i>
            </td>
        </tr>
        ${showOldWounds ? (oldRows || `<tr class="darksheet-wound-empty"><td colspan="4">No old wounds or scars.</td></tr>`) : ""}
    `;
}

async function addWoundsToSheet(sheet, html, data) {
    const actor = sheet?.actor ?? data?.actor;
    if (!actor) return;

    const root = darksheetSheetRoot(sheet, html);
    if (!root || root.querySelector("[data-darksheet-wounds]")) return;

    let woundlist = actor.flags?.darksheet?.woundlist;
    if (!Array.isArray(woundlist)) {
        woundlist = [];
        await actor.setFlag("darksheet", "woundlist", woundlist);
    }
    if (actor.flags?.darksheet?.displayOldWounds === undefined) {
        await actor.setFlag("darksheet", "displayOldWounds", false);
    }

    const target = findWoundSheetTarget(root);
    if (!target) return;

    const showOldWounds = !!actor.flags?.darksheet?.displayOldWounds;
    const activeCount = woundlist.filter(wound => !wound.healed).length;
    const treatedCount = woundlist.filter(wound => !wound.healed && wound.treated).length;
    const healedCount = woundlist.filter(wound => wound.healed).length;
    const wrapper = document.createElement("section");
    wrapper.className = "darksheet-wounds pills-group woundsection";
    wrapper.dataset.darksheetWounds = "true";
    wrapper.innerHTML = `
        <h3 class="icon">
            <i class="fas fa-bandage"></i>
            <span class="roboto-upper">Wounds / Scars</span>
            <small>${treatedCount}/${activeCount} treated \u00B7 ${healedCount} old</small>
        </h3>
        <div class="darksheet-wound-actions">
            <button type="button" class="rollable button rollReopenWounds" title="Roll for reopened treated wounds"><i class="fas fa-dice-d20"></i> Reopen</button>
            <button type="button" class="rollable button addwoundbutton"><i class="fas fa-plus"></i> Add Wound</button>
        </div>
        <table class="woundlist" id="woundlistid-${actor.id}" actorid="${actor.id}">
            <thead><tr><th>Wound</th><th>Treated</th><th>Effect</th><th></th></tr></thead>
            <tbody>${woundRowsHtml(woundlist, showOldWounds)}</tbody>
        </table>
    `;
    target.append(wrapper);

    wrapper.addEventListener("change", async event => {
        const location = event.target.closest("[data-wound-location]");
        const treated = event.target.closest("[data-wound-treated]");
        if (!location && !treated) return;
        const list = foundry.utils.deepClone(actor.flags?.darksheet?.woundlist ?? []);
        const index = Number((location ?? treated).dataset.woundLocation ?? (location ?? treated).dataset.woundTreated);
        if (!list[index]) return;
        if (location) list[index].location = location.value;
        if (treated) list[index].treated = treated.checked;
        await actor.setFlag("darksheet", "woundlist", list);
        document.activeElement?.blur?.();
    });

    wrapper.addEventListener("click", async event => {
        const add = event.target.closest(".addwoundbutton");
        const reopen = event.target.closest(".rollReopenWounds");
        const toggleOld = event.target.closest("[data-wound-toggle-old]");
        const heal = event.target.closest("[data-wound-heal]");
        const del = event.target.closest("[data-wound-delete]");
        if (add) {
            event.preventDefault();
            addWoundToCharacter(actor);
            return;
        }
        if (reopen) {
            event.preventDefault();
            rollReopenWounds(actor);
            return;
        }
        if (toggleOld) {
            event.preventDefault();
            await actor.setFlag("darksheet", "displayOldWounds", !actor.flags?.darksheet?.displayOldWounds);
            return;
        }
        if (heal || del) {
            event.preventDefault();
            const list = foundry.utils.deepClone(actor.flags?.darksheet?.woundlist ?? []);
            const index = Number((heal ?? del).dataset.woundHeal ?? (heal ?? del).dataset.woundDelete);
            if (!list[index]) return;
            if (heal) {
                list[index].healed = true;
                list[index].healedDate = await getTimeStamp();
            } else {
                list.splice(index, 1);
            }
            await actor.setFlag("darksheet", "woundlist", list);
            document.activeElement?.blur?.();
        }
    });
}
async function rollReopenWounds(actor) {
    let woundlist = actor.getFlag('darksheet', 'woundlist');

    let reopenedWounds = [];

    for (let i = 0; i < woundlist.length; i++) {
        let wound = woundlist[i];
        if (!wound.healed && wound.treated) {
            let roll = await new Roll("1d20").evaluate();
            let effect = "";

            if (roll.total == 1) {
                effect = "The wound reopens and you lose a hit die (no longer treated).";
                wound.healed = false;
                wound.treated = false;
                wound.hitDieLost = true;
                await actor.setFlag('darksheet', 'woundlist', woundlist, {
                    diff: true
                });
                reopenedWounds.push(i);
                createRollMessage(actor, "Wound-Reopen: " + wound.location, roll, null, roll.total, null, "1d20", 'fa-regular fa-face-head-bandage', effect, "darksheetNegativeMessage");
            } else if (roll.total >= 2 && roll.total <= 8) {
                effect = "The wound reopens (no longer treated).";
                wound.healed = false;
                wound.treated = false;
                await actor.setFlag('darksheet', 'woundlist', woundlist, {
                    diff: true
                });
                reopenedWounds.push(i);
                createRollMessage(actor, "Wound-Reopen: " + wound.location, roll, null, roll.total, null, "1d20", 'fa-regular fa-face-head-bandage', effect, "darksheetNegativeMessage");
            } else if (roll.total >= 9 && roll.total <= 20) {
                effect = "The wound remains closed.";
                createRollMessage(actor, "Wound-Reopen: " + wound.location, roll, null, roll.total, null, "1d20", 'fa-regular fa-face-head-bandage', effect);
            }
        }
    }
}

async function rollHealingWounds(actor) {
    let woundlist = actor.getFlag('darksheet', 'woundlist');

    let healedWounds = [];
    let failedHealingChecks = [];
    let style = "";
    let flavorText = "";
    for (let i = 0; i < woundlist.length; i++) {
        let wound = woundlist[i];
        if (!wound.healed) {
            let roll = await new Roll("1d20").evaluate();
            if (roll.total + actor.system.skills.med.total >= 15) {
                healedWounds.push(i);
                wound.healed = true;
                wound.healedDate = Date.now();
                await actor.setFlag('darksheet', 'woundlist', woundlist, {
                    diff: true
                });
                style = "darksheetPositiveMessage";
                flavorText = "Wound is healed.";
            } else {
                failedHealingChecks.push(i);
                style = "darksheetNegativeMessage";
                flavorText = "Is not fully healed yet.";
            }

            createRollMessage(actor, "Healing Wounds: " + wound.location, roll, null, roll.total, null, "1d20 + CON (Medicine) Mod", 'fa-regular fa-bandage', flavorText, style);
        }
    }
}

async function addWoundToCharacter(actor) {
    let woundlisttext;
    let woundlist = actor.flags.darksheet.woundlist ? actor.flags.darksheet.woundlist : [];

    let date = '';
    await getTimeStamp().then((timestamp) => {
        date = timestamp;
    });

    //ADD WOUND
    let wound = {
        location: "",
        treated: false,
        healed: false,
        gainedDate: date,
        healedDate: ''
    }

    woundlist.push(wound);

    await actor.setFlag('darksheet', 'woundlist', woundlist, {
        diff: true
    });
}

async function getTimeStamp() {
    const currentDate = new Date();

    // Get the date components
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();

    // Get the time components
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
}

async function darkSheetSetup(app, html, data) {

    let actor = game.actors.contents.find((a) => a._id === data.actor._id);
    if (actor === undefined) {
        return;
    }

    let saveCantrips = game.settings.get('darksheet', 'savecantrips');
    data.savecantrips = saveCantrips;

    html.find("[data-darksheet-open-crafting]").off("click.darksheetCrafting").on("click.darksheetCrafting", event => {
        event.preventDefault();
        Darksheet.openCrafting(event.currentTarget.dataset.actorId || actor.id);
    });

    //SET UP SHEET BY SETTING CLASSES
    //DEATH SAVES
    const deathSaves = html.find('.death-saves');
    deathSaves.find('.counter-value').children().first().remove();
    deathSaves.find('.counter-value').children().first().remove();
    deathSaves.children().first()
        .removeAttr('data-action')
        .addClass('tableCheck')
        .attr('tableCheck', 'Death Saving Throw');
    //ACTIVE INITIATIVE
    let armorclass = html[0].getElementsByClassName("attribute-name box-title")[2];
    if (armorclass == undefined) //NEW SHEET
        armorclass = html[0].getElementsByClassName("ac-badge")[0];
    armorclass.classList.add("rollable", "darksheet_AC");
    let primaryCastingAbility = data.actor.system.attributes.spellcasting;

    // Find the specific spellcasting card div where the data-ability attribute matches the primaryCastingAbility.
    let spellcastingCard = Array.from(document.querySelectorAll('.spellcasting.card.primary'))
        .find(card => card.getAttribute('data-ability') === primaryCastingAbility);

    //ACTIVE SAVES
    if (spellcastingCard) {
        let abilitySpan = spellcastingCard.querySelector('.ability');
        abilitySpan.classList.add("rollable", "darksheet_AS");
    }
    //DEATHSAVES
    /*//Deactivate OLD
    html.find(".death-saves").remove();
    let sheet = html.find(".counters");
    let DeathSaves = await darksheetRenderTemplate("modules/darksheet/templates/deathsaves.html", data);
    sheet.prepend(DeathSaves);*/

    //region INVENTORY
    if (!game.settings.get("darksheet", "hidenotches")) {
        const randomNotch = document.createElement("button");
        randomNotch.classList.add("randomnotch", "rollable", "button");
        randomNotch.type = "button";
        randomNotch.textContent = "Random Notch";
        const currencyElement = html[0].querySelector(".currency");
        currencyElement.insertBefore(randomNotch, currencyElement.firstChild);
    }
    //ADD HEADER ATTRIBUTES
    let currentSlots = 0;

    actor.items.forEach(function(item) {
        // Ensure that item.flags.darksheet?.item?.slots and item.system.quantity are defined, otherwise use 0
        const slots = item.flags?.darksheet?.item?.slots ?? 0;
        const quantity = item.system?.quantity ?? 0;

        if (!(game.settings.get('darksheet', 'equippedDontUseSlots') && item.system.equipped)) {
            currentSlots += slots * quantity;
        }

    });

    const slotCapacity = darksheetActorSlotCapacity(actor);
    let maxSlots = slotCapacity.maxSlots;
    let percentage = (currentSlots / maxSlots) * 100;

    if (game.settings.get('darksheet', 'slotbasedinventory')) { // IF SLOTS ARE ENABLED
        //SET ENCUMBRANCE BAR
        let encumbrance = html.find(".encumbrance").find(".meter");
        // dnd5e 5.x reworked the sheet - the legacy encumbrance markup may not
        // exist. Guard each lookup so the rest of darkSheetSetup still runs.
        if (encumbrance.length && encumbrance[0]) {
            const currentValue = encumbrance.find("div").find(".value")[0];
            if (currentValue) currentValue.textContent = parseFloat(currentSlots).toFixed(1);
            const maxValue = encumbrance.find("div").find(".max")[0];
            if (maxValue) maxValue.textContent = maxSlots + " Slots";
            const multiplier = html.find(".encumbrance").find(".info").find(".multiplier").find(".value")[0];
            if (multiplier) multiplier.textContent = "x" + slotCapacity.strengthMultiplier;

            const size = html.find(".encumbrance").find(".info").find(".size");
            if (size.length) {
                const sizeVal = size.find(".value")[0];
                if (sizeVal) sizeVal.textContent = "+" + slotCapacity.sizeSlots;
                const sizeLbl = size.find(".label")[0];
                if (sizeLbl) sizeLbl.textContent = "Size-Slots";
                size.appendTo(size.parent());
            }

            if (percentage <= 100)
                encumbrance[0].style = "--bar-percentage:" + Math.min(percentage, 100) + "%;";
            else
                encumbrance[0].style = "background: red;border: 2px solid red;--bar-percentage:" + Math.min(percentage, 100) + "%;";

            //SET BAR ARROWS - only if they still exist
            for (let i = 0; i < 3; i++) {
                if (encumbrance[0].children.length > 2) encumbrance[0].children[2].remove();
            }
            if (encumbrance[0].children.length > 1) encumbrance[0].children[1].remove();
        }
    }

    let inventoryList = html[0].getElementsByClassName("inventory-list")[0];
    if (!inventoryList) return;   // dnd5e 5.x sheet uses different markup; bail safely.

    for (let i = 0; i < inventoryList.getElementsByClassName("items-header").length; i++) {

        const header = inventoryList.getElementsByClassName("items-header")[i];
        //SET WEIGHT TO SLOTS
        if (game.settings.get('darksheet', 'slotbasedinventory')) {
            const weightEl = header.getElementsByClassName("item-weight")[0];
            if (weightEl) weightEl.innerHTML = "Slots";
        }
        let node = header.children[1];
        if (!node) continue;  // dnd5e 5.x inventory header may not have the same children
        if (!game.settings.get('darksheet', 'hidenotches') && !header.querySelector('.item-notches')) {
            //NOTCHES
            let notchesHeader = document.createElement("div");
            notchesHeader.classList.add("item-header", "item-weight", "item-notches");
            notchesHeader.innerHTML = 'Notches';
            header.insertBefore(notchesHeader, node);
        }
        //AMMODIE
        if (!game.settings.get('darksheet', 'hideammodie') && !header.querySelector('.item-ammodie')) {
            let ammodieHeader = document.createElement("div");
            ammodieHeader.classList.add("item-header", "item-weight", "item-ammodie");
            ammodieHeader.innerHTML = 'Ammodie';
            header.insertBefore(ammodieHeader, node);
        }

    }
    //region INVENTORY
    //DISPLAY ATTRIBUTES IN LIST
    let automaticSlots = game.settings.get('darksheet', 'automaticSlots');
    let automaticFragility = game.settings.get('darksheet', 'automaticFragility');
    const automaticSlotTable = darksheetItemBulkTable();
    const automaticFragileTable = darksheetFragileItemsTable();
    let updates = [];
    for (let i = 0; i < inventoryList.getElementsByClassName("item").length; i++) {
        //CREATE ELEMENTS
        var _notches = document.createElement("div");
        var _ammodie = document.createElement("div");
        var _slots = document.createElement("div");
        //ASSIGN CLASSES
        if (!game.settings.get('darksheet', 'hidenotches')) 
            _notches.classList.add("item-detail", "item-weight", "item-notches");
        
        _ammodie.classList.add("item-detail", "item-weight", "item-ammodieLabel");
        
        if (game.settings.get('darksheet', 'slotbasedinventory')) 
            _slots.classList.add("item-detail", "item-weight", "item-slots");

        //GET DATA
        let item = inventoryList.getElementsByClassName("item")[i];
        let itemRow = item.getElementsByClassName("item-row")[0];
        let _item = actor.items.find(i => i.id == item.dataset.itemId);
        if (!_item) continue;

        // Socket pips (early pass - covers items whose name isn't rebuilt below)
        darksheetInjectRowSockets(item, _item);

        const darksheetItem = _item.flags?.darksheet?.item;
        const missingFragility = darksheetItem?.fragility === undefined || darksheetItem?.fragility === null || darksheetItem?.fragility === "";
        const needsDefaultWeaponFragility = _item.type === "weapon" && missingFragility;
        const missingSlots = darksheetItem?.slots === undefined || darksheetItem?.slots === null;
        if (!darksheetItem || needsDefaultWeaponFragility || (automaticFragility && missingFragility) || (automaticSlots && missingSlots)) {
            //try find slot
            let slot = darksheetItem?.slots ?? 1;
            let fragility = darksheetItem?.fragility ?? "";
            if (needsDefaultWeaponFragility) fragility = 10;
            for (const [itemName, bulkValue] of Object.entries(automaticSlotTable)) {

                if (_item.name.includes(itemName)) {
                    // Handle slot assignment based on automaticSlots setting
                    if (automaticSlots) {
                        slot = bulkValue;
                        console.log(`Darksheet | ${_item.name} is assigned ${slot} slots.`);
                    }

                    // Check fragility based on automaticFragility setting
                    if (automaticFragility && missingFragility) {
                        if (isItemFragile(_item.name, automaticFragileTable)) {
                            console.log(`Darksheet | ${_item.name} is considered fragile.`);
                            fragility = 1;
                        } else {
                            console.log(`Darksheet | ${_item.name} is not considered fragile.`);
                            fragility = 10;
                        }
                        console.log(`Darksheet | ${_item.name} has a fragility rating of ${fragility}.`);
                    }
                    break;
                }
            }
            updates.push({
                "_id": _item.id,
                "flags.darksheet.item.slots": slot,
                //"flags.darksheet.item.notches": null,
                //"flags.darksheet.item.quality": "pristine",
                "flags.darksheet.item.fragility": fragility,
                //"flags.darksheet.item.temper": "",
                "flags.darksheet.item.ammodie": "",
            });
        }
        if (_item?.flags?.darksheet?.item) {
            let itemData = _item.flags?.darksheet?.item;
            let product = itemData.slots * _item.system.quantity;
            let usesSlots = (product % 1 === 0) ? product.toString() : product.toFixed(1);
            //GET REFERENCE TO ITEM WEIGHT TO REMOVE IT LATER; BECAUSE IT SHARES THE CLASS WITH THE ADDED ELEMENTS
            let itemWeight = item.getElementsByClassName("item-weight")[0];
            let price = item.getElementsByClassName("item-price")[0];
            darksheetApplyQualityValueToPriceElement(price, _item);
            //FILL WITH DATA
            let minusNotchButton = document.createElement("button");
            minusNotchButton.type = "button";
            let plusNotchButton = document.createElement("button");
            plusNotchButton.type = "button";
            minusNotchButton.innerHTML = "<label>-</label>";
            plusNotchButton.innerHTML = "<label>+</label>";

            minusNotchButton.classList.add("darksheetbuttonMinus", "notchButton");
            plusNotchButton.classList.add("darksheetbuttonPlus", "notchButton");

            if (!game.settings.get('darksheet', 'hidenotches')) 
                _notches.append(
                    itemData?.notches > 0 ? minusNotchButton : "", 
                    itemData?.notches > 0 ? itemData?.notches : "", 
                    plusNotchButton
                );                
            
            _ammodie.innerHTML = itemData.ammodie !== undefined ? '<label class="ammodieLabel">' + itemData.ammodie + '</label>' : "";

            if (game.settings.get('darksheet', 'slotbasedinventory')) _slots.innerHTML = itemData.slots !== undefined ? usesSlots : "";
            //INSERT NOTCHES
            if (!game.settings.get('darksheet', 'hidenotches')) 
                if(itemRow)
                    itemRow.insertBefore(_notches, price);

            if (itemData.ammodie == "")
                _ammodie.classList.remove("item-ammodieLabel");

            if (!game.settings.get('darksheet', 'hideammodie')) 
                itemRow.insertBefore(_ammodie, price);

            if (game.settings.get('darksheet', 'slotbasedinventory')) {
                itemRow.insertBefore(_slots, itemWeight);
                itemWeight.remove();
            }

            if (!game.settings.get('darksheet', 'disableItemDamage')) {
                //CHANGE DISPLAY NAME
                let itemname = _item.name;
                /*if (_item.flags.darksheet.item.temper) {
 itemname = "[" + _item.flags.darksheet.item.temper + "] " + itemname;
 }*/ //OLD TEMPER DISPLAY METHOD
                if (_item.type == "weapon" && _item.system.damage.base.denomination > 0) {
                    itemname += " ("+_item.system.damage.base.number+"d" + _item.system.damage.base.denomination + ")";
                }
                if (_item.type == "equipment" && _item.system.armor.value != 0) {
                    itemname += " (" + _item.system.armor.value + " AC)";
                }
                /*if(_item.flags.darksheet.item.fragility){
 const notchOptions = {
 1: 'Delicate',
 2: 'Frail',
 3: 'Basic',
 5: 'Solid',
 10: 'Sturdy',
 15: 'Durable',
 20: 'Very Sturdy',
 50: 'Fabled',
 100: 'Indestructible'
 };
 itemname = "["+notchOptions[_item.flags.darksheet.item.fragility] + "] " + itemname;
 }*/
                
                item.children[0].children[0].children[1].children[0].innerHTML = itemname;
                // re-add socket pips (the name rebuild above wipes the early pass)
                darksheetInjectRowSockets(item, _item);

                //TEMPER
                if (itemData.temper) {
                    let temper = itemData.temper;
                    let temperLabel = document.createElement("span");
                    temperLabel.classList.add("DarktemperLabel","darktemper"+temper);
                    temperLabel.textContent = temper.charAt(0).toUpperCase() + temper.slice(1);
                    if (DARKSHEET_TEMPER_INFO[temper]) temperLabel.dataset.tooltip = DARKSHEET_TEMPER_INFO[temper].full;
                    item.classList.add(temper);
                    let titleElement = item.getElementsByClassName("title")[0];
                    if (titleElement) {
                        titleElement.prepend(temperLabel); // Prepend the quality label
                    }
                }
                
                //QUALITY
                if (itemData.quality) {
                    let quality = itemData.quality;
                    if(quality == "pristine") continue;
                    item.classList.add(quality);
                    const wear = darksheetWearInfo(_item);
                    if (!wear) {
                        let qualityLabel = document.createElement("span");
                        qualityLabel.classList.add("DarkQualityLabel","darkQuality"+quality);
                        qualityLabel.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
                        let titleElement = item.getElementsByClassName("title")[0];
                        if (titleElement) titleElement.prepend(qualityLabel); // Prepend the quality label
                    } else {
                        // Show wear on the item's icon instead of a name tag
                        const iconEl = item.querySelector(".item-image") || item.querySelector(".item-img") || item.querySelector(".item-name img") || item.querySelector("img");
                        darksheetApplyWearTo(iconEl, wear);
                    }
                }
                
                //SHATTERED
                // Add a separate label if shattered
                if (itemname.includes("[Shattered]")) {
                    let shatteredLabel = document.createElement("span");
                    shatteredLabel.classList.add("shattered-label");
                    shatteredLabel.textContent = "Shattered";
                    //item.children[0].children[0].children[1].children[0].prepend(shatteredLabel); // Add shattered label at the beginning
                }
            }
        }
    }
    // ---- Container ammodie badges (dnd5e 5.x renders containers in a separate <ul class="containers"> list) ----
    if (!game.settings.get('darksheet', 'hideammodie')) {
        const containerNodes = html[0].querySelectorAll('ul.containers > li.container, ul.containers > li.draggable[data-item-id]');
        containerNodes.forEach(node => {
            const containerId = node.dataset.itemId;
            if (!containerId) return;
            const containerItem = actor.items.get(containerId);
            const ammodie = containerItem?.flags?.darksheet?.item?.ammodie;
            // Remove an existing badge so a stale value gets cleared.
            node.querySelector(".ds-container-ammodie")?.remove();
            if (!ammodie) return;
            const badge = document.createElement("span");
            badge.classList.add("ds-container-ammodie", "ammodieLabel", "item-ammodieLabel");
            badge.dataset.itemId = containerId;
            badge.setAttribute("title", `Ammodie: ${ammodie} \u2014 click to roll`);
            badge.innerHTML = `<i class="fas fa-dice-${ammodie}" inert></i> ${ammodie}`;
            badge.addEventListener("pointerdown", event => {
                event.stopPropagation();
            });
            badge.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                await rollAmmodieItem(actor, containerItem);
            });
            // Place the badge on the container link/thumb so it floats over the artwork.
            const host = node.querySelector("a.item-action") ?? node;
            host.appendChild(badge);
        });
    }

    actor.updateEmbeddedDocuments('Item', updates).then(() => {
        console.log('Darksheet | Inventory updated successfully.');
    }).catch(error => {
        console.error('Darksheet | Failed to update inventory:', error);
    });

    //ADD LISTENERS
    html.find('.darksheet_AC').click(async (event) => {
        event.preventDefault();
        let ac = actor.system.attributes.ac.value;
        let roll1 = await new Roll("1d20").evaluate();
        let roll2 = await new Roll("1d20").evaluate();
        let rollResult = roll1._total + ac;
        let rollResult2 = roll2._total + ac;
        let rollformula = "1d20 + " + ac;

        if (game.settings.get('darksheet', 'smalldefense')) {
            rollResult = roll1._total + ac - 10;
            rollResult2 = roll2._total + ac - 10;
            rollformula = "1d20 + " + ac + " - 10";
        }
        /*if (game.settings.get('darksheet', 'smalldefense')) {
 rollResult -= 10;
 rollResult2 -= 10;
 }*/
        //let wounds = this.actor.system.attributes.wounds.value;
        let actorID = actor.id;
        let negative = "";
        if (roll1.result == 1 || roll2.result == 1) {
            negative = "darksheetNegativeMessage";
        }
        if (roll1.result == 20 || roll2.result == 20) {
            negative = "darksheetPositiveMessage";
        }

        createRollMessage(actor, "Defense Roll", roll1, roll2, rollResult, rollResult2, rollformula, "fa-solid fa-shield", "", negative)
    });
    html.find('.burnoutclick').click(async (event) => {
        event.preventDefault();
        if (data?.options?.token?.actorLink === false || app?.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | Unlinked tokens are not supported.");
            return;
        }
        await rollBurnout(actor);
    });
    html.find('.tableCheck').click(async (event) => {
        event.preventDefault();
        const check = event.currentTarget;
        const tableName = check?.dataset?.tableCheck || check?.getAttribute?.("tableCheck");
        if (!tableName) return;
        await rollFromTable(tableName);
    });
    html.find('.item-ammodieLabel').click(async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (data.options.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | Unlinked tokens are not supported.");
            return;
        }
        await rollAmmodie(event, actor);
    });
    html.find('.staminacheck').click(async event => {
        event.preventDefault();
        let roll = await new Roll("1d6").evaluate();
        // Roll outcome
        let outcome;
        let newExhaustion = data.actor.flags.darksheet.attributes.exhaustion; //TODO: EXHAUSTION CALCULATION BASED ON THE INDEXES

        const foodValues = ["foodstuffed", "foodwellfed", "foodok", "foodpekish", "foodhungry", "foodravenous", "foodstarving"];
        const waterValues = ["wquenched", "wrefreshed", "wok", "wparched", "wthirsty", "wdry", "wdehydrated"];
        const fatigueValues = ["exenegised", "exwell", "exok", "extired", "exsleepy", "exvsleepy", "exbarely"];

        let foodIndex = foodValues.indexOf(data.actor.flags.darksheet.attributes.saturation);
        let waterIndex = waterValues.indexOf(data.actor.flags.darksheet.attributes.thirst);
        let fatigueIndex = fatigueValues.indexOf(data.actor.flags.darksheet.attributes.fatigue);

        if (roll._total >= 1 && roll._total <= 2) {
            outcome = "Hunger +1";
            foodIndex += 1;
        } else if (roll._total >= 3 && roll._total <= 4) {
            outcome = "Thirst +1";
            waterIndex += 1;
        } else if (roll._total >= 5 && roll._total <= 6) {
            outcome = "Fatigue +1";
            fatigueIndex += 1;
        }

        createRollMessage(data.actor, "Stamina Check", roll, null, roll._total, null, "1d6", "fa-regular fa-dice-d6", outcome);

        if (
            foodValues[foodIndex] !== data.actor.flags.darksheet.attributes.saturation ||
            waterValues[waterIndex] !== data.actor.flags.darksheet.attributes.thirst ||
            fatigueValues[fatigueIndex] !== data.actor.flags.darksheet.attributes.fatigue ||
            newExhaustion !== data.actor.flags.darksheet.attributes.exhaustion
        ) {
            await data.actor.update({
                'flags.darksheet.attributes.saturation': foodValues[foodIndex],
                'flags.darksheet.attributes.thirst': waterValues[waterIndex],
                'flags.darksheet.attributes.fatigue': fatigueValues[fatigueIndex],
                'flags.darksheet.attributes.exhaustion': newExhaustion
            }, {
                diff: true
            });
        }
    })
    html.find('.darksheet_AS').click(async (event) => {
        event.preventDefault();
        if (data.options.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | Unlinked tokens are not supported.");
            return;
        }
        let ac = actor.system.attributes.ac.value;
        let roll1 = await new Roll("1d20").evaluate()
        let roll2 = await new Roll("1d20").evaluate()
        let rollformula = "1d20 + " + ac;
        /*if (game.settings.get('darksheet', 'smalldefense')) {
 rollResult -= 10;
 rollResult2 -= 10;
 }*/
        //let wounds = this.actor.system.attributes.wounds.value;
        let actorID = actor.id;
        let negative = "";
        if (roll1.result == 1 || roll2.result == 1) {
            negative = "darksheetNegativeMessage";
        }
        if (roll1.result == 20 || roll2.result == 20) {
            negative = "darksheetPositiveMessage";
        }

        createRollMessage(actor, "Saving Attack", roll1, roll2, roll1.result, roll2.result, rollformula, "fa-solid fa-hand-holding-magic", "", negative)
    });
    // dnd5e 5.x V2 sheets no longer expose data.options.token / data.actor as
    // live references - pull straight from `app` (the sheet instance).
    const _actor = app?.actor ?? data?.actor;
    const _tokenUnlinked = () => app?.token?.actorLink === false;

    html.find('.darksheetbuttonPlus').click(async (event) => {
        event.preventDefault();
        if (_tokenUnlinked()) {
            ui.notifications.warn("Darksheet | This token is not linked to the actor. Notch wasn't added.");
            return;
        }
        let item = _actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId);
        await addNotchToItem(item);
        ui.notifications.notify("Added a notch to " + item.name);
    });
    html.find('.darksheetbuttonMinus').click(async (event) => {
        event.preventDefault();
        if (_tokenUnlinked()) {
            ui.notifications.warn("Darksheet | This token is not linked to the actor. Notch wasn't removed.");
            return;
        }
        let item = _actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId);
        await removeNotchFromItem(item);
        ui.notifications.notify("Removed a notch from " + item.name);
    });
    html.find('.randomnotch').click(async event => {
        event.preventDefault();
        let array = _actor.items.filter(i => i.type !== "feat" && i.type !== "class" && i.type !== "spell");
        if (!array.length) return;
        let randomItem = array[Math.floor(Math.random() * array.length)];
        let querysel = '[data-item-id="' + randomItem.id + '"]';
        const target = document.querySelectorAll(querysel)[0]?.getElementsByClassName("darksheetbuttonPlus")[0];
        if (target) target.click();
    });

}

async function rollAmmodie(event, actor) {
    // Find the host row (legacy .item rows OR new dnd5e 5.x container li elements OR explicit data-item-id on the badge itself).
    const host = event.target.closest("[data-item-id]");
    if (!host) return;
    const itemId = host.dataset.itemId;
    let item = actor.items.get(itemId) ?? actor.items.find(i => i.id == itemId);
    if (!item) return;
    return rollAmmodieItem(actor, item);
}

async function rollAmmodieItem(actor, item) {
    if (!actor || !item) return null;
    let currentAmmodie = item.flags?.darksheet?.item?.ammodie;
    if (!currentAmmodie) return;
    let newAmmodie = currentAmmodie;
    let roll = await new Roll("1" + currentAmmodie, actor.getRollData?.() ?? {}).evaluate();
    let rollResult = roll.total ?? roll._total;
    let ammodieArray = ["d20", "d12", "d10", "d8", "d6", "d4"];
    let change = "";
    let negative = "";
    if (rollResult == 1 || rollResult == 2) { //MAKE DICE SMALLER
        if (currentAmmodie != "d4") {
            newAmmodie = ammodieArray[ammodieArray.indexOf(currentAmmodie) + 1];
            change = " -> " + newAmmodie;
            negative = "darksheetNegativeMessage";
        } else {
            newAmmodie = "";
            change = " -> Depleted.";
            negative = "darksheetNegativeMessage";
        }
    }

    await createRollMessage(actor, "Ammo Dice (" + currentAmmodie + ")" + change, roll, null, rollResult, null, "1" + currentAmmodie, "fa-solid  fa-dice-" + currentAmmodie, "", negative);

    await item.update({
        'flags.darksheet.item.ammodie': newAmmodie
    });

    return { actor, item, roll, rollResult, oldAmmodie: currentAmmodie, newAmmodie };
}

async function rollBurnout(actor) {
    let burnoutDie = actor.flags.darksheet.attributes.burnout.value;
    let newBurnoutDie = burnoutDie;
    const regionModValue = String(actor.flags?.darksheet?.attributes?.regionmod?.value ?? "0");
    let burnoutArray = ["12", "10", "8", "6", "4", "4"];
    let regionDict = {
        "3": "Serene",
        "2": "Calm",
        "1": "Stable",
        "0": "Normal",
        "-1": "Unstable",
        "-2": "Wild",
        "-3": "Chaotic"
    };

    let roll1 = await new Roll("1d" + burnoutDie).evaluate();
    let rollResult = roll1._total;
    let change = "";
    let negative = "";
    if (rollResult == 1 || rollResult == 2) //BURNOUT
    {
        if (burnoutDie != "4") {
            newBurnoutDie = burnoutArray[burnoutArray.indexOf(burnoutDie) + 1];
            change = '<i class="fa-solid fa-arrow-right"></i> d' + newBurnoutDie;
        }
        negative = "darksheetNegativeMessage";
    }

    var regionMod = parseInt(regionModValue, 10);
    if (regionMod < 0) { //IF NEGATIVELY AFFECTED BY REGION
        regionMod = burnoutArray.indexOf(burnoutDie) - parseInt(regionModValue);
        //console.log("Regionmodz step2 kleiner: "+regionmodz);
        if (regionMod >= 5) {
            regionMod = 4;
        }
    } else { //IF POSITIVELY AFFECTED BY REGION
        regionMod = burnoutArray.indexOf(burnoutDie) - parseInt(regionModValue);
        //console.log("Regionmodz step3 greater: "+regionmodz);
        if (regionMod <= 0) {
            regionMod = 0;
        }
    }
    var regionDice = burnoutArray[regionMod];
    let regiontext = regionDict["" + regionModValue] + " [d" + regionDice + "] ";
    if (regionMod == burnoutArray.indexOf(burnoutDie)) { //IF NO CHANGE TROUGH REGION MOD
        regiontext = '';
    }

    await createRollMessage(actor, "" + regiontext + " Spell Burnout (d" + burnoutDie + ")" + change, roll1, null, rollResult, null, "1" + burnoutDie, "fa-solid  fa-dice-d" + regionDice, "", negative);
    await actor.update({
        'flags.darksheet.attributes.burnout.value': newBurnoutDie
    });
}

async function createRollMessage(actor, rollname, roll1, roll2, rollResult1, rollResult2, rollFormula, icon, flavorText = null, customClass = "") {
    let content = ``;
    let roll1Color = "";
    let roll2Color = "";
    if (flavorText == null) flavorText = "";
    if (roll1 && roll2) { //CREATE DUO ROLL
        roll1Color = roll1.result == 1 ? "darkRollRed" : roll1.result == 20 ? "darkRollGreen" : "darkRoll";
        roll2Color = roll2.result == 1 ? "darkRollRed" : roll2.result == 20 ? "darkRollGreen" : "darkRoll";
        content = `
                    <div class="dnd5e chat-card item-card darksheet-chat-card ${customClass}" data-acor-id="${actor.id}">
                        <header class="card-header flexrow">
                            <i class="chatIcon ${icon}"></i>     
                            <div class="dice-roll red-dual darksheetRoll">
                                <h3 class="darksheet-chat-title" style="text-align-last: center;">${rollname}</h3>
                                <span class="flavor-text" style="text-align: center;">${flavorText}</span>
                                <div class="dice-result">
                                    <div class="dice-formula dice-tooltips" style="display: none;">${rollFormula}</div>
                                    <div class="dice-row darkRoll">
                                        <div class="dice-row" style="display: flex;">
                                            <div class="tooltip dual-left" style="flex: 0.5;">
                                                <div class="dice-tooltips" style="display: none;">                                <div class="dice">
                                                        <ol class="dice-rolls">
                                                            <li class="roll d20 ${roll1Color}" style="position: relative;left: 50px;">${roll1._total}</li>
                                                        </ol>
                                                    </div>                            </div>
                                            </div>
                                            <div class="tooltip dual-right" style="flex: 0.5;">
                                                <div class="dice-tooltips" style="display: none;">                                <div class="dice">
                                                        <ol class="dice-rolls">
                                                            <li class="roll d20 ${roll2Color}" style="position: relative;left: 50px;">${roll2._total}</li>
                                                        </ol>
                                                    </div>                            </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="dice-row" style="display: flex;">
                                        <h4 class="dice-total dual-left darkChatResult ${roll1Color}">${rollResult1}</h4>
                                        <h4 class="dice-total dual-right darkChatResult ${roll2Color}">${rollResult2}</h4>
                                    </div>
                                </div>
                            </div>
                        </header>
                    </div>`;
    } else { //CREATE SINGLE ROLL
        roll1Color = roll1.result == 1 ? "darkRollRed" : roll1.result == 20 ? "darkRollGreen" : "darkRoll";
        content = `
        <div class="dnd5e chat-card item-card darksheet-chat-card ${customClass}" data-acor-id="${actor.id}">
            <header class="card-header flexrow">
                <i class="chatIcon ${icon}"></i>     
                <div class="dice-roll red-dual darksheetRoll">
                    <div class="dice-result">
                        <div class="dice-formula dice-tooltips" style="display: none;">${rollFormula}</div>
                        <div class="dice-row darkRoll">
                            <div class="dice-row" style="display: flex;">
                                <div class="tooltip" style="flex: 0.5;">
                                    <div class="dice-tooltips" style="display: none;">
                                        <div class="dice">
                                            <ol class="dice-rolls">
                                                <li class="roll d20 ${roll1Color}">${roll1._total}</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="dice-row" style="display: flex;">
                            <h4 class="dice-total dual-left darkChatResult ${roll1Color}" style="flex: 1;">${rollResult1}</h4>
                        </div>
                    </div>
                    <h3 class="darksheet-chat-title" style="text-align: center;">${rollname}</h3>
                    <span class="flavor-text" style="text-align: center;">${flavorText}</span>
                </div>
            </header>
        </div>`;
    }
    // Send content to chat
    let rollWhisper = false;
    let rollBlind = false;
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
    if (rollMode === "blindroll") rollBlind = false;

    ChatMessage.create({
        user: game.user.id,
        content: content,
        speaker: {
            actor: actor.id,
            token: actor.token,
            alias: actor.name,
        },
        sound: CONFIG.sounds.dice,
    });
}

function escapeDarkscreenChat(value) {
    const text = String(value ?? "");
    return foundry.utils.escapeHTML?.(text) ?? text.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

function darkscreenGmWhisperRecipients() {
    return game.users.filter(user => user.isGM).map(user => user.id);
}

let darkscreenDiseaseReminderStamp = "";

function darkscreenNowSeconds() {
    return Number(game.time?.worldTime ?? Math.floor(Date.now() / 1000));
}

function dueDarkscreenDiseaseEntries() {
    const diseases = getDarkscreenStore().diseases ?? { list: [] };
    const now = darkscreenNowSeconds();
    return (diseases.list ?? []).filter(entry =>
        entry
        && !["cured", "cleared"].includes(entry.status)
        && entry.nextCheckAt
        && Number(entry.nextCheckAt) <= now
        && (entry.nextRoll || entry.status === "exposed" || entry.status === "infected" || entry.status === "declining")
    );
}

function showDarkscreenDiseaseReminder({ force = false } = {}) {
    if (!game.user?.isGM) return;
    const due = dueDarkscreenDiseaseEntries();
    if (!due.length) return;
    const stamp = due.map(entry => `${entry.id}:${entry.nextRoll || entry.status}:${entry.nextCheckAt}`).join("|");
    if (!force && darkscreenDiseaseReminderStamp === stamp) return;
    darkscreenDiseaseReminderStamp = stamp;
    const rows = due.map(entry => {
        const actor = game.actors.get(entry.actorId);
        const custom = getDarkscreenStore().diseases?.custom?.[entry.diseaseKey];
        const diseaseName = custom?.name || entry.diseaseName || entry.diseaseKey || "Disease";
        const roll = entry.nextRoll || (entry.status === "exposed" ? "Infection" : "Escalation");
        return `<li><strong>${escapeDarkscreenChat(actor?.name || "Unknown")}</strong>: ${escapeDarkscreenChat(diseaseName)} - ${escapeDarkscreenChat(roll)} check</li>`;
    }).join("");
    new Dialog({
        title: "Disease Checks Due",
        content: `<p>Darker Dungeons disease checks are due after the incubation period passes.</p><ul>${rows}</ul>`,
        buttons: {
            open: {
                label: "Open Disease Tracker",
                icon: '<i class="fas fa-virus"></i>',
                callback: async () => {
                    await Darksheet.setDarkscreenPage("disease");
                    Darkscreen.initializeDarkscreen();
                }
            },
            later: { label: "Remind Later", icon: '<i class="fas fa-clock"></i>' }
        },
        default: "open"
    }).render(true);
}

async function postDarkscreenChatMessage({
    title = "Darker Dungeons",
    icon = "fa-book-dead",
    body = "",
    actor = null,
    whisper = null,
    speaker = null,
    cssClass = "",
    sound = null
} = {}) {
    const iconClass = String(icon).includes("fa-") ? icon : `fa-solid ${icon}`;
    const bodyHtml = Array.isArray(body) ? `<p>${body.join("<br>")}</p>` : String(body ?? "");
    const whisperIds = whisper === true || whisper === "gm"
        ? darkscreenGmWhisperRecipients()
        : Array.isArray(whisper) ? whisper : undefined;
    const chatData = {
        user: game.user.id,
        speaker: speaker ?? (actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker?.()),
        whisper: whisperIds,
        content: `
            <div class="dnd5e chat-card item-card darksheet-chat-card darkscreen-chat-message ${cssClass}" data-darkscreen-message="true">
                <header class="card-header flexrow">
                    <i class="chatIcon ${iconClass}"></i>
                    <h3 class="darksheet-chat-title">${escapeDarkscreenChat(title)}</h3>
                </header>
                ${bodyHtml}
            </div>`
    };
    if (sound) chatData.sound = sound;
    return ChatMessage.create(chatData);
}

async function rollFromTable(tableName) {
    // Get the table by name
    const table = game.tables.getName(tableName);

    if (table) {
        // Draw a result from the table
        const result = await table.draw();
    } else {
        ui.notifications.error(`Table ${tableName} not found.`);
    }
}
async function addNotchToItem(itemGet) {
    let darksheet = itemGet;
    if (darksheet.flags?.darksheet == null) {
        await darksheet.sheet.render(true);
        await darksheet.sheet.render(false);
    }
    let itemData = darksheet.flags?.darksheet?.item ?? {};
    let notches = itemData.notches ?? 0;

    let fragility = itemData.fragility;
    if (darksheet.type === "weapon" && (fragility === undefined || fragility === null || fragility === "")) {
        fragility = 10;
        await darksheet.update({ 'flags.darksheet.item.fragility': fragility });
    }
    let maxnotches = itemData.maxnotches;
    let temper = itemData.temper;
    if (temper === "" || temper === undefined) {
        temper = 1;
    } else if (temper === "Pure") {
        temper = 0.5;
    } else if (temper === "Royal") {
        temper = 0.25;
    } else if (temper === "Astral") {
        temper = 0.125;
    }
    if (darksheet.name.includes("[Shattered]")) {
        ui.notifications.warn("This item is [Shattered], you need to rename it first...");
    } else {

        if (notches === undefined) {
            notches = temper;
        } else {
            notches = Number(notches) + temper;
        }

        if (fragility === undefined || fragility === "" || fragility === "indestructible") {
            fragility = 999;
        } else if (fragility === "custom") {
            fragility = maxnotches;
        } else if (notches >= parseInt(fragility)) {

            if (game.settings.get('darksheet', 'destroyshatter')) {
                let newname = "[Shattered] " + darksheet.name;
                await darksheet.update({
                    'name': newname
                });
            } else {
                if (darksheet.system.quantity > 1) {
                    let newQuantity = darksheet.system.quantity - 1;
                    await darksheet.update({
                        'system.quantity': newQuantity
                    });
                    ui.notifications.notify("<b>One of your " + darksheet.name + " has shattered</b>");
                } else {
                    darksheet.delete();
                    ui.notifications.notify("<b>Your " + darksheet.name + " has shattered</b>");
                }

            }

            const shatterActor = darksheet.actor;
            const shatterImg = shatterActor?.prototypeToken?.texture?.src || darksheet.img || "";
            let content = `
                <div class="dnd5e chat-card item-card darksheet-chat-card">
                    <header class="card-header flexrow">
                        <img src="${shatterImg}" title="" width="36" height="36" style="border: none;"/> <h3 class="darksheet-chat-title">${escapeSheetHtml(shatterActor?.name ?? "")}'s </h3>
                    </header>
                    <label style="font-size: 14px;">${escapeSheetHtml(darksheet.name)} just shattered</label>
                </div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM");
            if (rollMode === "blindroll") rollBlind = true;
            ChatMessage.create({
                user: game.user.id,
                content: content,
                speaker: shatterActor ? ChatMessage.getSpeaker({ actor: shatterActor }) : ChatMessage.getSpeaker(),
                whisper: rollWhisper || undefined,
                blind: rollBlind,
                sound: CONFIG.sounds.dice,
            });

        }

    }
    //VALUE CALCULATION=====
    let quality = darksheet.flags?.darksheet?.item?.quality;
    if (quality === undefined || quality === "") {
        quality = "pristine";
    }
    if (notches >= 4) {
        quality = "scarred";
    } else if (notches >= 2 && quality === "worn") {
        quality = "well-worn";
    } else if (notches >= 1 && quality === "pristine") {
        quality = "worn";
    }
    await darksheet.update({
        id: darksheet.id,
        'flags.darksheet.item.quality': quality
    });

    if (darksheet.type === "equipment") { //ARMOR CALCULATION=====
        let AC = darksheet.system.armor.value;
        let newBaseAC = 0;
        const baseArmor = darksheet.flags?.darksheet?.item?.basearmor;
        if (baseArmor != null)
            newBaseAC = baseArmor;
        if (newBaseAC == 0) {
            newBaseAC = AC;
        }
        if (Number.isInteger(notches)) {
            let newAC = AC - 1;
            if (newAC <= 0) {
                newAC = 0
            };
            if (newAC >= basenotchdamage) {
                newAC = basenotchdamage
            }

            await darksheet.update({
                id: darksheet.id,
                'data.armor.value': newAC,
                'flags.darksheet.item.basearmor': newBaseAC
            });
            await darksheet.update({
                id: darksheet.id,
                'flags.darksheet.item.basenotchdamage': basenotchdamage
            });
            if (newAC <= 1) { //SHATTER IF AC 1 OR Lower
                if (game.settings.get('darksheet', 'shatterwhen1') && quality === "scarred") {
                    if (game.settings.get('darksheet', 'destroyshatter')) {
                        let newname = "[Shattered] " + darksheet.name;
                        await darksheet.update({
                            id: darksheet.id,
                            'name': newname
                        });
                    } else {
                        await darksheet.delete();
                    }
                }
            }
        }
    }
    if (darksheet.type === "tool") {
        await darksheet.update({
            id: darksheet.id,
            'data.notchpen': notches
        });
    }
    if (darksheet.type === "weapon") {
        let updatedamage = {};
    
        if (Number.isInteger(notches) && darksheet.system.damage.base.number !== 0) {
            let diceNumber = darksheet.system.damage.base.number; // Number of dice
            let denomination = darksheet.system.damage.base.denomination; // Dice size (6, 8, etc.)
        
            let newDiceNumber = diceNumber;
            let newDenomination = denomination;
        
            if (darksheet.flags.darksheet.currentweapondamage) {
                newDiceNumber = darksheet.flags.darksheet.currentweapondamage.number;
                newDenomination = darksheet.flags.darksheet.currentweapondamage.denomination;
            }
        
            let baseweapondamage = darksheet.flags?.darksheet?.item?.baseweapondamage;
            if (!baseweapondamage) {
                baseweapondamage = { number: newDiceNumber, denomination: newDenomination };
                await darksheet.update({ 'flags.darksheet.item.baseweapondamage': baseweapondamage });
            }
        
            // **WEAPON DAMAGE DEGRADATION**
            if (newDiceNumber === 1) { 
                // **Type A - Single Die Weapons**
                switch (newDenomination) {
                    case 12: newDenomination = 10; break;
                    case 10: newDenomination = 8; break;
                    case 8:  newDenomination = 6; break;
                    case 6:  newDenomination = 4; break;
                    case 4:  newDenomination = 1; break;
                    case 1:
                        await darksheet.update({ 'flags.darksheet.item.basenotchdamage': notches });
        
                        if (game.settings.get('darksheet', 'shatterwhen1') && quality === "scarred") {
                            if (game.settings.get('darksheet', 'destroyshatter')) {
                                await darksheet.update({ 'name': `[Shattered] ${darksheet.name}` });
                            } else {
                                await darksheet.delete();
                            }
                        }
                        break;
                }
            } else if (newDiceNumber === 2) { 
                // **Type B - Multi-Die Weapons**
                switch (`${newDiceNumber}d${newDenomination}`) {
                    case "2d6":
                        newDiceNumber = 1; newDenomination = 6; // Becomes 1d6 + 1d4
                        break;
                    case "1d6":
                        newDiceNumber = 2; newDenomination = 4; // Becomes 2d4
                        break;
                    case "2d4":
                        newDiceNumber = 1; newDenomination = 4; // Becomes 1d4 + 1
                        break;
                    case "1d4":
                        newDiceNumber = 1; newDenomination = 1; // Becomes 1
                        await darksheet.update({ 'flags.darksheet.item.basenotchdamage': notches });
        
                        if (game.settings.get('darksheet', 'shatterwhen1') && quality === "scarred") {
                            if (game.settings.get('darksheet', 'destroyshatter')) {
                                await darksheet.update({ 'name': `[Shattered] ${darksheet.name}` });
                            } else {
                                await darksheet.delete();
                            }
                        }
                        break;
                    case "1d4 + 1":
                        newDiceNumber = 1; newDenomination = 1;
                        await darksheet.update({ 'flags.darksheet.item.basenotchdamage': notches });
                        break;
                    case "1":
                        newDiceNumber = 0; newDenomination = 0;
                        await darksheet.update({ 'flags.darksheet.item.basenotchdamage': notches });
        
                        if (game.settings.get('darksheet', 'shatterwhen1') && quality === "scarred") {
                            if (game.settings.get('darksheet', 'destroyshatter')) {
                                await darksheet.update({ 'name': `[Shattered] ${darksheet.name}` });
                            } else {
                                await darksheet.delete();
                            }
                        }
                        break;
                }
            }
        
            // **Update weapon damage**
            let updatedamage = {
                number: newDiceNumber,
                denomination: newDenomination
            };
        
            await darksheet.update({
                'system.damage.base.number': updatedamage.number,
                'system.damage.base.denomination': updatedamage.denomination,
                'flags.darksheet.item.currentweapondamage': updatedamage,
            });
        }        
    }
    
    await darksheet.update({'flags.darksheet.item.notches': notches});
    
}
async function removeNotchFromItem(item) {
    let darksheet = item;
    let basenotchdamage = darksheet.flags?.darksheet?.item?.basenotchdamage ?? "";
    let notches = darksheet.flags?.darksheet?.item?.notches ?? 0;
    let newnotches = Math.max(0, notches - 1); // Ensure newnotches doesn't go below 0

    if (darksheet.name.includes("[Shattered]")) {
        ui.notifications.warn("This item is [Shattered], you need to rename it first...");
        return;
    }

    // Update notches
    await darksheet.update({ 'flags.darksheet.item.notches': newnotches });

    if (darksheet.type === "equipment") {
        let AC = darksheet.system.armor.value ?? 0;
        let BaseAC = darksheet.flags?.darksheet?.item?.basearmor ?? AC;

        if (AC < BaseAC) {
            AC++;
        } else {
            AC = BaseAC;
        }

        await darksheet.update({
            'system.armor.value': AC,
            'flags.darksheet.item.basearmor': BaseAC,
            'flags.darksheet.item.basenotchdamage': basenotchdamage
        });
    }

    if (darksheet.type === "tool") {
        await darksheet.update({ 'system.notchpen': newnotches });
    }

    // **Weapon Damage Restoration**
    if (darksheet.type === "weapon") {
        let diceNumber = darksheet.system.damage.base.number ?? 1;
        let denomination = darksheet.system.damage.base.denomination ?? 4;

        let baseweapondamage = darksheet.flags?.darksheet?.item?.baseweapondamage ?? { number: diceNumber, denomination: denomination };
        let weapondamage = { number: diceNumber, denomination: denomination };

        // **Damage Restoration Progression**
        const damageProgression = {
            "1d1": { number: 1, denomination: 4 },
            "1d4": { number: 1, denomination: 6 },
            "1d6": { number: 1, denomination: 8 },
            "1d8": { number: 1, denomination: 10 },
            "1d10": { number: 1, denomination: 12 },
            "1d12": { number: 1, denomination: 20 },
            "2d4": { number: 1, denomination: 6 },
            "1d6 + 1d4": { number: 2, denomination: 6 },
            "2d6": { number: 1, denomination: 8 },
            "1d8 + 1d6": { number: 2, denomination: 8 },
            "2d8": { number: 1, denomination: 10 },
            "1d10 + 1d8": { number: 2, denomination: 10 },
            "2d10": { number: 1, denomination: 12 },
            "1d12 + 1d10": { number: 2, denomination: 12 },
            "2d12": { number: 1, denomination: 20 },
            "1d20 + 1d12": { number: 2, denomination: 20 },
            "2d20": { number: 2, denomination: 20 }
        };

        // Convert the current damage to a string key
        let damageKey = `${weapondamage.number}d${weapondamage.denomination}`;

        if (damageProgression[damageKey]) {
            weapondamage = damageProgression[damageKey];
        }

        // Ensure it does not exceed the base damage
        if (weapondamage.number > baseweapondamage.number || weapondamage.denomination > baseweapondamage.denomination) {
            weapondamage = baseweapondamage;
        }

        // **Apply the Damage Update**
        await darksheet.update({
            'system.damage.base.number': weapondamage.number,
            'system.damage.base.denomination': weapondamage.denomination,
            'flags.darksheet.item.currentweapondamage': weapondamage,
            'flags.darksheet.item.basenotchdamage': basenotchdamage
        });
    }
}


//public functions
window.Darksheet = class Darksheet {
    static async RollBurnout(PlayerName) {}
    static async RollBurnout(PlayerName) {}
    static changeCharacterRole(characterName, role) {
        const character = game.actors.find((actor) => actor.name === characterName);
        if (character) {
            character.update({
                'flags.darksheet.currentRole': role
            }, {
                diff: true
            });
        }
    }
    // ---- Shared travel roles -------------------------------------------------
    // A character's travel role is a single global value (flags.darksheet.currentRole),
    // edited from BOTH the Party screen and the Journey screen's Travel Roles sidebar.
    static TRAVEL_ROLE_KEYS = ["guide", "forager", "scout", "lookout"];
    // role -> actorId, derived from each party member's currentRole (first match wins).
    static travelRolesFromActors() {
        const roles = { guide: "", forager: "", scout: "", lookout: "" };
        for (const a of Darksheet.journeyPartyActors()) {
            const r = a.flags?.darksheet?.currentRole;
            if (r && (r in roles) && !roles[r]) roles[r] = a.id;
        }
        return roles;
    }
    // Assign one travel role to one actor; clears whoever else held that role so the
    // role -> actor mapping the Journey screen shows stays 1:1.
    static async assignTravelRole(actorId, role) {
        role = role || "";
        const actor = actorId ? game.actors.get(actorId) : null;
        const updates = [];
        if (role && actor) {
            for (const a of Darksheet.journeyPartyActors()) {
                if (a.id !== actor.id && a.flags?.darksheet?.currentRole === role) {
                    updates.push({ _id: a.id, "flags.darksheet.currentRole": "" });
                }
            }
        }
        if (actor) updates.push({ _id: actor.id, "flags.darksheet.currentRole": role });
        if (updates.length) await Actor.updateDocuments(updates);
    }
    static changeBarAttribute(characterName, attributeToChange, value) {
        const character = game.actors.find((actor) => actor.name === characterName);
        if (character) {
            character.setFlag('darksheet', attributeToChange.split('darksheet.')[1], value, {
                diff: true
            });
        }
    }
    static async setDarkscreenPage(page) {
        const screenData = await ensureDarkscreenFlags();
        await setDarkscreenFlags({
            ...screenData,
            lastpage: page || "party"
        });
    }
    static getDarkscreenStore() {
        return getDarkscreenStore();
    }
    static async setDarkscreenStore(store = {}) {
        await setDarkscreenFlags(store);
        return getDarkscreenStore();
    }
    static async patchDarkscreenStore(partialData = {}) {
        await this.setDarkscreenData(partialData);
        return getDarkscreenStore();
    }
    static async setDarkscreenData(partialData = {}) {
        const screenData = await ensureDarkscreenFlags();
        const merge = globalThis.foundry?.utils?.mergeObject ?? globalThis.mergeObject;
        const mergedData = merge
            ? merge(screenData, partialData, { inplace: false, overwrite: true })
            : { ...screenData, ...partialData };
        await setDarkscreenFlags(mergedData);
    }
    static updateDreadZoneBanner() {
        darksheetUpdateDreadZoneBanner();
    }
    static getDarkscreenJourneyStore() {
        try {
            return cloneDarkscreenData(getDarkscreenStore().journey ?? { list: {}, activeId: null });
        } catch (_) {
            return { list: {}, activeId: null };
        }
    }
    static async setDarkscreenJourneyStore(store = { list: {}, activeId: null }) {
        const stored = cloneDarkscreenData(store);
        const screenData = await ensureDarkscreenFlags();
        await setDarkscreenFlags({ ...screenData, journey: stored });
    }
    static async rollTable(tableName) {
        await rollFromTable(tableName);
    }
    static openItemAutomationTables() {
        if (!game.user?.isGM && !game.user?.can?.("SETTINGS_MODIFY")) {
            ui.notifications.warn("Darksheet | Only a GM can configure automatic item tables.");
            return null;
        }
        const app = new DarksheetItemAutomationTablesConfig();
        app.render(true);
        return app;
    }
    static openCrafting(actorId = null) {
        const actor = actorId?.items ? actorId : (typeof actorId === "string" && actorId ? game.actors.get(actorId) : null);
        return Darkscreen.initializeDarkscreen({
            mode: "crafting",
            page: "gemcutting",
            actorId: actor?.id || (typeof actorId === "string" ? actorId : "")
        });
    }
    static _resolveMacroActor(actorId = null) {
        if (actorId?.items) return actorId;
        if (typeof actorId === "string" && actorId) {
            const actor = game.actors.get(actorId);
            if (actor) return actor;
        }
        const controlled = globalThis.canvas?.tokens?.controlled ?? [];
        if (controlled.length > 1) {
            ui.notifications.warn("Darksheet | Select one token for this macro.");
            return null;
        }
        return controlled[0]?.actor ?? game.user?.character ?? null;
    }
    static async _promptNumber({ title = "Darksheet", label = "Value", value = 10, min = 0, step = 1 } = {}) {
        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title,
                content: `
                    <form>
                        <div class="form-group">
                            <label>${escapeSheetHtml(label)}</label>
                            <input type="number" name="value" value="${Number(value)}" min="${Number(min)}" step="${Number(step)}" autofocus>
                        </div>
                    </form>
                `,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Request",
                        callback: html => {
                            const input = html?.[0]?.querySelector?.('input[name="value"]');
                            const parsed = Number(input?.value ?? value);
                            finish(Number.isFinite(parsed) ? parsed : value);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "ok",
                close: () => finish(null)
            }).render(true);
        });
    }
    static async rollBurnoutMacro() {
        const token = canvas.tokens?.controlled?.[0];
        const actor = token?.actor ?? game.user?.character;
        if (!actor) { ui.notifications.warn("Darksheet | Select a token first."); return; }
        if (token && token.document?.actorLink === false) { ui.notifications.warn("Darksheet | Unlinked tokens are not supported."); return; }
        if (!actor.flags?.darksheet?.attributes?.burnout?.value) { ui.notifications.warn("Darksheet | This actor has no spell burnout die set."); return; }
        return rollBurnout(actor);
    }
    static async requestCampChecksMacro() {
        if (!game.user.isGM) {
            ui.notifications.warn("Darksheet | Only the GM can request camp checks.");
            return null;
        }
        const dc = await this._promptNumber({
            title: "Request Camp Checks",
            label: "Camping DC",
            value: 10,
            min: 1,
            step: 1
        });
        if (dc === null) return null;
        return Darksheet.requestCampRoles(Math.max(1, Math.round(dc)));
    }
    static async longRestChecksMacro() {
        if (!game.user.isGM) {
            ui.notifications.warn("Darksheet | Only the GM can request long rest checks.");
            return null;
        }
        return Darksheet.openCityRest();
    }
    static async requestLongRestChecksMacro() {
        return Darksheet.longRestChecksMacro();
    }
    static async rollAmmoDie(actorId, itemId) {
        const actor = this._resolveMacroActor(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a token or assign a user character first.");
            return null;
        }
        const item = actor.items.get(itemId) ?? actor.items.find(i => i.id === itemId);
        if (!item) {
            ui.notifications.warn("Darksheet | Ammo die item not found.");
            return null;
        }
        return rollAmmodieItem(actor, item);
    }
    static async ammoDieMacro(actorId = null) {
        const actor = this._resolveMacroActor(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a token or assign a user character first.");
            return null;
        }
        const ammoItems = actor.items.filter(item => item.flags?.darksheet?.item?.ammodie);
        if (!ammoItems.length) {
            ui.notifications.warn(`Darksheet | ${actor.name} has no inventory items with ammo die.`);
            return null;
        }

        const rows = ammoItems.map(item => {
            const die = item.flags?.darksheet?.item?.ammodie ?? "";
            const img = item.img || "icons/svg/item-bag.svg";
            return `
                <button type="button" class="darksheet-ammo-die-pick" data-item-id="${escapeSheetHtml(item.id)}" style="display:grid; grid-template-columns:32px minmax(0,1fr) auto; gap:8px; align-items:center; width:100%; margin:0 0 6px; padding:6px 8px; text-align:left;">
                    <img src="${escapeSheetHtml(img)}" alt="" width="32" height="32" style="border:0; object-fit:cover;">
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeSheetHtml(item.name)}</span>
                    <strong>${escapeSheetHtml(die)}</strong>
                </button>
            `;
        }).join("");

        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            const dialog = new Dialog({
                title: `${actor.name}: Ammo Die`,
                content: `<div class="darksheet-ammo-die-dialog">${rows}</div>`,
                buttons: {
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                render: html => {
                    const root = html?.[0] ?? html;
                    root?.querySelectorAll?.(".darksheet-ammo-die-pick").forEach(button => {
                        button.addEventListener("click", async event => {
                            event.preventDefault();
                            const itemId = button.dataset.itemId;
                            const item = actor.items.get(itemId) ?? actor.items.find(i => i.id === itemId);
                            const result = await rollAmmodieItem(actor, item);
                            finish(result);
                            dialog.close();
                        });
                    });
                },
                close: () => finish(null)
            }, { width: 420 });
            dialog.render(true);
        });
    }
    static _getActorSkillMod(actor, skill) {
        const data = actor?.system?.skills?.[skill] ?? {};
        return Number(data.total ?? data.mod ?? 0);
    }
    static _skillFormula(actor, skill) {
        const mod = Darksheet._getActorSkillMod(actor, skill);
        return `1d20 ${mod >= 0 ? "+" : ""} ${mod}`;
    }
    static _actorSelectOptions(actors, selectedId = "", { includeNone = true } = {}) {
        const options = includeNone ? ['<option value="">-- none --</option>'] : [];
        for (const actor of actors) {
            const selected = actor.id === selectedId ? " selected" : "";
            options.push(`<option value="${escapeSheetHtml(actor.id)}"${selected}>${escapeSheetHtml(actor.name)}</option>`);
        }
        return options.join("");
    }
    static _defaultJourneyDc() {
        try {
            const store = Darksheet.getDarkscreenJourneyStore();
            const active = store?.list?.[store.activeId];
            const dc = Number(active?.dc ?? getDarkscreenStore()?.journey?.dc ?? 12);
            return Number.isFinite(dc) ? dc : 12;
        } catch (_) {
            return 12;
        }
    }
    static async requestJourneyChecksMacro() {
        if (!game.user?.isGM) {
            ui.notifications.warn("Darksheet | Only the GM can request journey checks.");
            return null;
        }
        const party = Darksheet.journeyPartyActors();
        if (!party.length) {
            ui.notifications.warn("Darksheet | No player characters found.");
            return null;
        }
        // Travel roles are now a single shared per-character value (also shown on
        // the Party screen), so derive role -> actor from the characters themselves.
        const savedRoles = Darksheet.travelRolesFromActors();
        const inParty = id => !!id && party.some(a => a.id === id);
        const defaults = {
            guide: inParty(savedRoles.guide) ? savedRoles.guide : (party[0]?.id ?? ""),
            forager: inParty(savedRoles.forager) ? savedRoles.forager : (party[1]?.id ?? party[0]?.id ?? ""),
            scout: inParty(savedRoles.scout) ? savedRoles.scout : (party[2]?.id ?? party[0]?.id ?? ""),
            lookout: inParty(savedRoles.lookout) ? savedRoles.lookout : (party[3]?.id ?? party[0]?.id ?? "")
        };
        const dc = Darksheet._defaultJourneyDc();
        const row = (key, label) => `
            <div class="form-group">
                <label>${escapeSheetHtml(label)}</label>
                <select name="${key}">${Darksheet._actorSelectOptions(party, defaults[key])}</select>
            </div>
        `;

        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title: "Request Journey Checks",
                content: `
                    <form>
                        <div class="form-group">
                            <label>Travel DC</label>
                            <input type="number" name="dc" value="${dc}" min="1" step="1" autofocus>
                        </div>
                        ${row("guide", "Guide / Navigation")}
                        ${row("forager", "Forager")}
                        ${row("scout", "Scout")}
                        ${row("lookout", "Lookout")}
                        <div class="form-group">
                            <label>Party stamina</label>
                            <input type="checkbox" name="stamina" checked>
                        </div>
                    </form>
                `,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d20"></i>',
                        label: "Roll Checks",
                        callback: html => {
                            const form = html?.[0]?.querySelector?.("form");
                            const data = new FormData(form);
                            const chosenRoles = {
                                guide: data.get("guide"),
                                forager: data.get("forager"),
                                scout: data.get("scout"),
                                lookout: data.get("lookout")
                            };
                            Darksheet._saveJourneyRoles(chosenRoles);
                            Darksheet._runJourneyChecks({
                                dc: Math.max(1, Math.round(Number(data.get("dc") || dc))),
                                stamina: !!form?.querySelector?.('input[name="stamina"]')?.checked,
                                roles: chosenRoles
                            }).then(finish);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "roll",
                close: () => finish(null)
            }, { width: 460 }).render(true);
        });
    }
    static async _saveJourneyRoles(roles = {}) {
        try {
            const store = Darksheet.getDarkscreenJourneyStore();
            if (store?.activeId && store.list?.[store.activeId]) store.list[store.activeId].roles = roles;
            else store.roles = roles;
            await Darksheet.setDarkscreenJourneyStore(store);
        } catch (error) {
            console.warn("Darksheet | Failed to save journey roles.", error);
        }
    }
    static async _runJourneyChecks({ dc = 12, stamina = true, roles = {} } = {}) {
        const party = Darksheet.journeyPartyActors();
        const roleDefs = [
            { key: "guide", label: "Guide / Navigation", skill: "sur" },
            { key: "forager", label: "Foraging", skill: "sur" },
            { key: "scout", label: "Scouting", skill: "prc" },
            { key: "lookout", label: "Lookout", skill: "prc" }
        ];
        const roleLines = [];
        for (const role of roleDefs) {
            const actor = game.actors.get(String(roles[role.key] || ""));
            if (!actor) {
                roleLines.push(`<strong>${escapeDarkscreenChat(role.label)}</strong>: <em>not assigned</em>`);
                continue;
            }
            const formula = Darksheet._skillFormula(actor, role.skill);
            const roll = await new Roll(formula, actor.getRollData()).evaluate();
            const total = roll.total ?? roll._total;
            const success = total >= dc;
            roleLines.push(`<strong>${escapeDarkscreenChat(role.label)}</strong> (${escapeDarkscreenChat(actor.name)}): ${total} vs DC ${dc} - ${success ? "Success" : "Failure"}`);
        }

        const staminaLines = [];
        if (stamina) {
            for (const actor of party) {
                const result = await Darksheet.staminaCheckActor(actor.id);
                if (result) staminaLines.push(`<strong>${escapeDarkscreenChat(result.name)}</strong>: ${result.total} - ${escapeDarkscreenChat(result.outcome)}`);
            }
        }

        const staminaHtml = stamina
            ? `<h4>Party Stamina</h4><p>${staminaLines.join("<br>") || "<em>No stamina results.</em>"}</p>`
            : "";
        await Darksheet.postDarkscreenChat({
            title: `Journey Checks - DC ${dc}`,
            icon: "fa-solid fa-map-location-dot",
            whisper: "gm",
            body: `<h4>Travel Roles</h4><p>${roleLines.join("<br>")}</p>${staminaHtml}`
        });
        Darksheet.darkScreenReload?.();
        return { dc, roles, stamina };
    }
    static async playerCampActivityMacro(actorId = null) {
        const actor = this._resolveMacroActor(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a token or assign a user character first.");
            return null;
        }
        const state = getDarkscreenStore()?.campfire ?? {};
        const dc = Number(state.activityDc ?? 10) || 10;
        const activityKeys = ["forage", "cook", "mend", "tendWounds", "keepWatch", "sleep"];
        const options = activityKeys.map(key => {
            const activity = CAMP_ACTIVITIES[key];
            return `<option value="${key}">${escapeSheetHtml(activity.label)}</option>`;
        }).join("");

        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title: `${actor.name}: Camp Activity`,
                content: `
                    <form>
                        <div class="form-group">
                            <label>Activity</label>
                            <select name="activity">${options}</select>
                        </div>
                        <div class="form-group">
                            <label>Activity DC</label>
                            <input type="number" name="dc" value="${dc}" min="1" step="1">
                        </div>
                    </form>
                `,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-campground"></i>',
                        label: "Do Activity",
                        callback: html => {
                            const data = new FormData(html?.[0]?.querySelector?.("form"));
                            Darksheet._runCampActivity(actor, String(data.get("activity") || "forage"), Math.max(1, Math.round(Number(data.get("dc") || dc)))).then(finish);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "roll",
                close: () => finish(null)
            }, { width: 420 }).render(true);
        });
    }
    static async _runCampActivity(actor, activityKey, dc = 10) {
        const activity = CAMP_ACTIVITIES[activityKey];
        if (!actor || !activity) return null;
        let total = null;
        let success = true;
        let rollRender = "";

        if (activity.skill) {
            const formula = Darksheet._skillFormula(actor, activity.skill);
            const roll = await new Roll(formula, actor.getRollData()).evaluate();
            total = roll.total ?? roll._total;
            success = total >= dc;
            rollRender = await roll.render();
        }

        const outcome = success
            ? await Darksheet._applyCampActivityEffect(actor, activity)
            : { text: `<em>Failure vs DC ${dc}.</em>` };
        await Darksheet.postDarkscreenChat({
            title: `${actor.name} - ${activity.label}${activity.skill ? ` (${activity.skill}, DC ${dc})` : ""}`,
            icon: `fa-solid ${activity.icon}`,
            actor,
            body: `${rollRender}<p>${outcome.text}</p>`
        });
        Darksheet.darkScreenReload?.();
        return { actorId: actor.id, activityKey, total, success };
    }
    static _conditionTrack(kind) {
        const tracks = {
            food: { path: "saturation", values: ["foodstuffed", "foodwellfed", "foodok", "foodpekish", "foodhungry", "foodravenous", "foodstarving"], label: "Hunger" },
            water: { path: "thirst", values: ["wquenched", "wrefreshed", "wok", "wparched", "wthirsty", "wdry", "wdehydrated"], label: "Thirst" },
            fatigue: { path: "fatigue", values: ["exenegised", "exwell", "exok", "extired", "exsleepy", "exvsleepy", "exbarely"], label: "Fatigue" }
        };
        return tracks[kind] ?? null;
    }
    static _conditionLabel(kind, value) {
        return LIFESTYLE_CONDITION_LABELS?.[value] ?? Darksheet._conditionTrack(kind)?.label ?? value ?? "";
    }
    static async _adjustActorCondition(actor, kind, delta) {
        const track = Darksheet._conditionTrack(kind);
        if (!actor || !track) return null;
        await darksheetEnsureFlags(actor);
        const current = actor.flags?.darksheet?.attributes?.[track.path];
        const idx = Math.max(0, track.values.indexOf(current));
        const next = Math.min(track.values.length - 1, Math.max(0, idx + Number(delta || 0)));
        const nextValue = track.values[next];
        if (nextValue !== current) {
            await actor.update({ [`flags.darksheet.attributes.${track.path}`]: nextValue }, { diff: true });
        }
        return { kind, label: track.label, previous: current, next: nextValue };
    }
    static async _consumeSurvivalResource(actor, kind) {
        await darksheetEnsureFlags(actor);
        const keys = kind === "food"
            ? ["food5", "food4", "food3", "food2", "food"]
            : ["waterskin5", "waterskin4", "waterskin3", "waterskin2", "waterskin"];
        const attrs = actor.flags?.darksheet?.attributes ?? {};
        const key = keys.find(k => attrs?.[k]?.value === true);
        if (key) {
            await actor.update({ [`flags.darksheet.attributes.${key}.value`]: false }, { diff: true });
            return { consumed: true, text: `${kind === "food" ? "Food" : "Water"} consumed.` };
        }
        const adjusted = await Darksheet._adjustActorCondition(actor, kind === "food" ? "food" : "water", 1);
        return {
            consumed: false,
            text: `No ${kind === "food" ? "food" : "water"} remaining - ${adjusted?.label ?? kind} worsened.`
        };
    }
    static async quickSurvivalUpkeepMacro(actorId = null) {
        const actor = this._resolveMacroActor(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a token or assign a user character first.");
            return null;
        }
        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title: `${actor.name}: Survival Upkeep`,
                content: `
                    <form>
                        <div class="form-group"><label>Consume food</label><input type="checkbox" name="food" checked></div>
                        <div class="form-group"><label>Consume water</label><input type="checkbox" name="water" checked></div>
                        <div class="form-group"><label>Roll stamina die</label><input type="checkbox" name="stamina" checked></div>
                    </form>
                `,
                buttons: {
                    apply: {
                        icon: '<i class="fas fa-bowl-food"></i>',
                        label: "Apply",
                        callback: html => {
                            const form = html?.[0]?.querySelector?.("form");
                            Darksheet._applyQuickSurvivalUpkeep(actor, {
                                food: !!form?.querySelector?.('input[name="food"]')?.checked,
                                water: !!form?.querySelector?.('input[name="water"]')?.checked,
                                stamina: !!form?.querySelector?.('input[name="stamina"]')?.checked
                            }).then(finish);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "apply",
                close: () => finish(null)
            }, { width: 400 }).render(true);
        });
    }
    static async _applyQuickSurvivalUpkeep(actor, options = {}) {
        const lines = [];
        if (options.food) lines.push((await Darksheet._consumeSurvivalResource(actor, "food")).text);
        if (options.water) lines.push((await Darksheet._consumeSurvivalResource(actor, "water")).text);
        if (options.stamina) {
            const result = await Darksheet.staminaCheckActor(actor.id);
            if (result) lines.push(`Stamina die ${result.total}: ${result.outcome}.`);
        }
        await darksheetEnsureFlags(actor);
        await syncDarksheetExhaustion(actor, { render: false });
        const attrs = actor.flags?.darksheet?.attributes ?? {};
        lines.push(`<strong>Now:</strong> Hunger ${escapeDarkscreenChat(Darksheet._conditionLabel("food", attrs.saturation))}, Thirst ${escapeDarkscreenChat(Darksheet._conditionLabel("water", attrs.thirst))}, Fatigue ${escapeDarkscreenChat(Darksheet._conditionLabel("fatigue", attrs.fatigue))}.`);
        await Darksheet.postDarkscreenChat({
            title: `${actor.name}: Survival Upkeep`,
            icon: "fa-solid fa-bowl-food",
            actor,
            body: `<p>${lines.join("<br>")}</p>`
        });
        Darksheet.darkScreenReload?.();
        return { actorId: actor.id, options };
    }
    static _healersKitItems(actor) {
        return actor?.items?.filter?.(item => /healer'?s\s+kit/i.test(item.name ?? "")) ?? [];
    }
    static async _consumeHealersKitUse(actor) {
        const kit = Darksheet._healersKitItems(actor)[0];
        if (!kit) return { consumed: false, text: "No healer's kit found." };
        const uses = Number(kit.system?.uses?.value);
        if (Number.isFinite(uses) && uses > 0) {
            await kit.update({ "system.uses.value": uses - 1 });
            return { consumed: true, text: `${kit.name} uses ${uses} -> ${uses - 1}.` };
        }
        const quantity = Number(kit.system?.quantity);
        if (Number.isFinite(quantity) && quantity > 1) {
            await kit.update({ "system.quantity": quantity - 1 });
            return { consumed: true, text: `${kit.name} quantity ${quantity} -> ${quantity - 1}.` };
        }
        return { consumed: false, text: `${kit.name} has no tracked uses to consume.` };
    }
    static async treatWoundMacro(actorId = null) {
        // The selected token is the HEALER; the targeted token is the patient.
        const healer = this._resolveMacroActor(actorId);
        if (!healer) {
            ui.notifications.warn("Darksheet | Select the token doing the healing first.");
            return null;
        }
        const targetToken = Array.from(game.user?.targets ?? [])[0];
        const patient = targetToken?.actor;
        if (!patient) {
            ui.notifications.warn("Darksheet | Target the wounded token (the patient) first.");
            return null;
        }
        if (!Darksheet._healersKitItems(healer).length) {
            ui.notifications.warn(`Darksheet | ${healer.name} needs a healer's kit to treat wounds.`);
            return null;
        }
        await darksheetEnsureFlags(patient);
        const wounds = (patient.flags?.darksheet?.woundlist ?? [])
            .map((wound, index) => ({ ...wound, index }))
            .filter(wound => !wound.healed && !wound.treated);
        if (!wounds.length) {
            ui.notifications.info(`Darksheet | ${patient.name} has no untreated wounds.`);
            return null;
        }
        const woundOptions = wounds.map(wound => `<option value="${wound.index}">${escapeSheetHtml(wound.location || `Wound ${wound.index + 1}`)}</option>`).join("");

        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title: `Treat Wound`,
                content: `
                    <form>
                        <p class="notes">${escapeSheetHtml(healer.name)} treats ${escapeSheetHtml(patient.name)} (1 hour, Medicine + healer's kit).</p>
                        <div class="form-group">
                            <label>Wound</label>
                            <select name="wound">${woundOptions}</select>
                        </div>
                        <div class="form-group">
                            <label>DC</label>
                            <input type="number" name="dc" value="10" min="1" step="1">
                        </div>
                        <div class="form-group"><label>Mark treated on success</label><input type="checkbox" name="mark" checked></div>
                        <div class="form-group"><label>Consume healer's kit use</label><input type="checkbox" name="consume" checked></div>
                    </form>
                `,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-staff-snake"></i>',
                        label: "Treat",
                        callback: html => {
                            const data = new FormData(html?.[0]?.querySelector?.("form"));
                            const form = html?.[0]?.querySelector?.("form");
                            Darksheet._rollTreatWound(healer, patient, {
                                woundIndex: Number(data.get("wound")),
                                dc: Math.max(1, Math.round(Number(data.get("dc") || 10))),
                                mark: !!form?.querySelector?.('input[name="mark"]')?.checked,
                                consume: !!form?.querySelector?.('input[name="consume"]')?.checked
                            }).then(finish);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "roll",
                close: () => finish(null)
            }, { width: 430 }).render(true);
        });
    }
    static async _rollTreatWound(healer, patient, { woundIndex, dc = 10, mark = true, consume = true } = {}) {
        if (!healer || !patient) {
            ui.notifications.warn("Darksheet | Need both a healer and a patient.");
            return null;
        }
        if (!Darksheet._healersKitItems(healer).length) {
            ui.notifications.warn(`Darksheet | ${healer.name} has no healer's kit.`);
            return null;
        }
        const list = foundry.utils.deepClone(patient.flags?.darksheet?.woundlist ?? []);
        const wound = list[woundIndex];
        if (!wound || wound.healed || wound.treated) {
            ui.notifications.warn("Darksheet | Wound not found or already treated.");
            return null;
        }
        const formula = Darksheet._skillFormula(healer, "med");
        const roll = await new Roll(formula, healer.getRollData()).evaluate();
        const total = roll.total ?? roll._total;
        const success = total >= dc;
        const lines = [`${escapeDarkscreenChat(healer.name)} treats ${escapeDarkscreenChat(patient.name)} \u2014 ${success ? "Success" : "Failure"} vs DC ${dc}.`];
        if (success && mark) {
            list[woundIndex].treated = true;
            await patient.update({ "flags.darksheet.woundlist": list }, { diff: true });
            lines.push(`Marked <strong>${escapeDarkscreenChat(wound.location || `Wound ${woundIndex + 1}`)}</strong> as treated.`);
        }
        if (consume) {
            const kit = await Darksheet._consumeHealersKitUse(healer);
            lines.push(escapeDarkscreenChat(kit.text));
        }
        const rollRender = await roll.render();
        await Darksheet.postDarkscreenChat({
            title: `Treat Wound`,
            icon: "fa-solid fa-staff-snake",
            actor: healer,
            body: `${rollRender}<p>${lines.join("<br>")}</p>`
        });
        Darksheet.darkScreenReload?.();
        return { healerId: healer.id, patientId: patient.id, woundIndex, total, success };
    }
    static async rollDarksheetTableMacro() {
        if (!game.user?.isGM) {
            ui.notifications.warn("Darksheet | Only the GM can roll Darksheet tables from this macro.");
            return null;
        }
        const choices = [];
        for (const table of game.tables?.contents ?? []) {
            choices.push({ source: "world", id: table.id, name: table.name, label: `${table.name} (World)` });
        }
        const pack = game.packs?.get?.("darksheet.darkrolltables");
        if (pack) {
            const index = await pack.getIndex();
            for (const entry of index) {
                choices.push({ source: "pack", id: entry._id, name: entry.name, label: `${entry.name} (Darksheet)` });
            }
        }
        choices.sort((a, b) => a.name.localeCompare(b.name));
        if (!choices.length) {
            ui.notifications.warn("Darksheet | No roll tables found.");
            return null;
        }
        const options = choices.map(choice => {
            const value = `${choice.source}:${choice.id}`;
            return `<option value="${escapeSheetHtml(value)}">${escapeSheetHtml(choice.label)}</option>`;
        }).join("");

        return new Promise(resolve => {
            let resolved = false;
            const finish = result => {
                if (resolved) return;
                resolved = true;
                resolve(result);
            };
            new Dialog({
                title: "Roll Darksheet Table",
                content: `<form><div class="form-group"><label>Table</label><select name="table">${options}</select></div></form>`,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-book"></i>',
                        label: "Roll",
                        callback: html => {
                            const value = String(new FormData(html?.[0]?.querySelector?.("form")).get("table") || "");
                            Darksheet._rollDarksheetTableChoice(value).then(finish);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-xmark"></i>',
                        label: "Cancel",
                        callback: () => finish(null)
                    }
                },
                default: "roll",
                close: () => finish(null)
            }, { width: 460 }).render(true);
        });
    }
    static async _rollDarksheetTableChoice(value) {
        const [source, id] = String(value || "").split(":");
        let table = null;
        if (source === "world") table = game.tables.get(id);
        else if (source === "pack") {
            const pack = game.packs?.get?.("darksheet.darkrolltables");
            table = await pack?.getDocument?.(id);
        }
        if (!table) {
            ui.notifications.warn("Darksheet | Roll table not found.");
            return null;
        }
        return table.draw();
    }
    static async rollDarkscreenCheck(actorId, label, formula = "1d20", dc = null, detail = "") {
        const actor = game.actors.get(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a character first.");
            return;
        }

        const roll = await new Roll(formula, actor.getRollData()).evaluate();
        const total = roll.total ?? roll._total;
        const target = Number(dc);
        const resultText = Number.isFinite(target)
            ? total >= target ? `Success vs DC ${target}` : `Failure vs DC ${target}`
            : detail;

        await createRollMessage(actor, label, roll, null, total, null, formula, "fa-solid fa-dice-d20", resultText);
    }
    static gmDarkscreenWhisperRecipients() {
        return darkscreenGmWhisperRecipients();
    }
    static async postDarkscreenChat(options = {}) {
        return postDarkscreenChatMessage(options);
    }
    static async syncSocketEffects(item) {
        return darksheetSyncSocketEffects(item);
    }
    static checkDiseaseReminders(options = {}) {
        return showDarkscreenDiseaseReminder(options);
    }

    static async convertAllItemsToSilverStandard() {
        if (!darksheetSilverStandardEnabled()) {
            ui.notifications.warn("Darksheet | Enable Silver Standard in module settings first.");
            return;
        }
        if (!game.user?.isGM) {
            ui.notifications.warn("Darksheet | Only the GM can convert world items.");
            return;
        }
        const confirmed = await Dialog.confirm({
            title: "Convert Items to Silver Standard",
            content: "<p>Convert all priced world and actor items that have not already been converted? This changes <strong>gp to sp</strong> and <strong>sp to cp</strong>, then marks each item so it is skipped in the future.</p>"
        });
        if (!confirmed) return;

        const worldItems = Array.from(game.items?.contents ?? game.items ?? []);
        const actorItems = Array.from(game.actors?.contents ?? game.actors ?? [])
            .flatMap(actor => Array.from(actor.items?.contents ?? actor.items ?? []));
        const items = [...worldItems, ...actorItems];

        let converted = 0;
        let skipped = 0;
        const failed = [];
        for (const item of items) {
            const value = darksheetPriceValue(item.system?.price);
            if (!(value > 0) || item.flags?.darksheet?.silverStandardApplied) {
                skipped++;
                continue;
            }
            const before = darksheetPriceDenomination(item.system?.price) || "gp";
            const after = darksheetSilverStandardDenomination(before, { stepSilver: true });
            if (!after || after === before) {
                skipped++;
                continue;
            }
            try {
                const updateData = typeof item.system?.price === "object" && item.system.price !== null
                    ? {
                        "system.price.denomination": after,
                        "flags.darksheet.silverStandardApplied": true
                    }
                    : {
                        "system.price": { value, denomination: after },
                        "flags.darksheet.silverStandardApplied": true
                    };
                await item.update(updateData, { render: false });
                converted++;
            } catch (error) {
                failed.push(item.name ?? item.id ?? "Unknown item");
                console.warn(`Darksheet | Failed to convert ${item.name} to Silver Standard.`, error);
            }
        }

        const message = `Darksheet | Silver Standard conversion complete: ${converted} converted, ${skipped} skipped${failed.length ? `, ${failed.length} failed` : ""}.`;
        if (failed.length) ui.notifications.warn(message);
        else ui.notifications.notify(message);
        await Darksheet.postDarkscreenChat({
            title: "Silver Standard Conversion",
            icon: "fa-solid fa-coins",
            body: `<p>${converted} priced item${converted === 1 ? "" : "s"} converted. ${skipped} skipped.${failed.length ? `<br><strong>Failed:</strong> ${failed.map(f => foundry.utils.escapeHTML(f)).join(", ")}` : ""}</p>`
        });
        Darksheet.darkScreenReload();
    }

    /* =====
 JOURNEY UPKEEP - party-wide stamina checks and food/water adjustments
 ===== */
    static journeyPartyActors() {
        // Linked player-character actors used for all journey upkeep actions.
        return game.actors.filter(actor => actor.type === "character" && actor.hasPlayerOwner);
    }

    static async staminaCheckActor(actorId) {
        const actor = game.actors.get(actorId);
        if (!actor) return null;
        await darksheetEnsureFlags(actor);
        const attrs = actor.flags?.darksheet?.attributes ?? {};
        const foodValues = ["foodstuffed", "foodwellfed", "foodok", "foodpekish", "foodhungry", "foodravenous", "foodstarving"];
        const waterValues = ["wquenched", "wrefreshed", "wok", "wparched", "wthirsty", "wdry", "wdehydrated"];
        const fatigueValues = ["exenegised", "exwell", "exok", "extired", "exsleepy", "exvsleepy", "exbarely"];
        let foodIndex = Math.max(0, foodValues.indexOf(attrs.saturation));
        let waterIndex = Math.max(0, waterValues.indexOf(attrs.thirst));
        let fatigueIndex = Math.max(0, fatigueValues.indexOf(attrs.fatigue));

        const roll = await new Roll("1d6").evaluate();
        const total = roll.total ?? roll._total;
        let outcome;
        if (total <= 2) { outcome = "Hunger +1"; foodIndex = Math.min(foodValues.length - 1, foodIndex + 1); }
        else if (total <= 4) { outcome = "Thirst +1"; waterIndex = Math.min(waterValues.length - 1, waterIndex + 1); }
        else { outcome = "Fatigue +1"; fatigueIndex = Math.min(fatigueValues.length - 1, fatigueIndex + 1); }

        await actor.update({
            'flags.darksheet.attributes.saturation': foodValues[foodIndex],
            'flags.darksheet.attributes.thirst': waterValues[waterIndex],
            'flags.darksheet.attributes.fatigue': fatigueValues[fatigueIndex]
        }, { diff: true });

        return { actorId, name: actor.name, total, outcome };
    }

    static async applyTimeOfDay(phase, dayTitle = "") {
        // Fixed progression per Darker Dungeons "Time of Day" table.
        const TABLE = {
            dawn:    { food: 1, water: 1, fatigue: 0, label: "Dawn",    icon: "fa-sun" },
            morning: { food: 0, water: 0, fatigue: 1, label: "Morning", icon: "fa-cloud-sun" },
            dusk:    { food: 1, water: 1, fatigue: 1, label: "Dusk",    icon: "fa-moon" },
            night:   { food: 0, water: 0, fatigue: 0, label: "Night",   icon: "fa-moon" }
        };
        const effect = TABLE[phase];
        if (!effect) return null;
        const party = Darksheet.journeyPartyActors();
        if (!party.length) {
            ui.notifications.warn("Darksheet | No player characters found.");
            return null;
        }
        const tracks = {
            food:    { path: "saturation", values: ["foodstuffed", "foodwellfed", "foodok", "foodpekish", "foodhungry", "foodravenous", "foodstarving"], label: "Hunger" },
            water:   { path: "thirst",     values: ["wquenched", "wrefreshed", "wok", "wparched", "wthirsty", "wdry", "wdehydrated"],                  label: "Thirst" },
            fatigue: { path: "fatigue",    values: ["exenegised", "exwell", "exok", "extired", "exsleepy", "exvsleepy", "exbarely"],                   label: "Fatigue" }
        };
        const affected = [];
        for (const actor of party) {
            await darksheetEnsureFlags(actor);
            const updates = {};
            for (const [kind, delta] of Object.entries(effect)) {
                if (kind === "label" || kind === "icon" || !delta) continue;
                const track = tracks[kind];
                if (!track) continue;
                const current = actor.flags?.darksheet?.attributes?.[track.path];
                const idx = Math.max(0, track.values.indexOf(current));
                const next = Math.min(track.values.length - 1, idx + delta);
                if (track.values[next] !== current) updates[`flags.darksheet.attributes.${track.path}`] = track.values[next];
            }
            if (Object.keys(updates).length) {
                await actor.update(updates, { diff: true });
                affected.push(actor.name);
            }
        }
        const effectsText = ["food", "water", "fatigue"]
            .filter(k => effect[k])
            .map(k => `${tracks[k].label} +${effect[k]}`)
            .join(" \u00B7 ");
        const bodyHtml = effectsText
            ? `<p><strong>${effectsText}</strong></p><p>${affected.length ? affected.join(", ") : "No characters affected."}</p>`
            : `<p><em>Phase marker \u2014 no automatic effects.</em></p>`;
        await Darksheet.postDarkscreenChat({
            title: `${dayTitle ? `${dayTitle} - ` : ""}${effect.label}`,
            icon: `fa-solid ${effect.icon}`,
            body: bodyHtml
        });
        return { phase, label: effect.label, affected };
    }

    static async adjustPartyAttribute(kind, delta) {
        const party = Darksheet.journeyPartyActors();
        if (!party.length) return 0;
        const tracks = {
            food: { path: "saturation", values: ["foodstuffed", "foodwellfed", "foodok", "foodpekish", "foodhungry", "foodravenous", "foodstarving"] },
            water: { path: "thirst", values: ["wquenched", "wrefreshed", "wok", "wparched", "wthirsty", "wdry", "wdehydrated"] },
            fatigue: { path: "fatigue", values: ["exenegised", "exwell", "exok", "extired", "exsleepy", "exvsleepy", "exbarely"] }
        };
        const track = tracks[kind];
        if (!track) return 0;
        // delta > 0 means worsen (more hungry/thirsty), delta < 0 means improve.
        const step = Math.sign(delta);
        const magnitude = Math.abs(delta);
        let changed = 0;
        for (const actor of party) {
            await darksheetEnsureFlags(actor);
            const current = actor.flags?.darksheet?.attributes?.[track.path];
            const idx = Math.max(0, track.values.indexOf(current));
            const next = Math.min(track.values.length - 1, Math.max(0, idx + step * magnitude));
            if (track.values[next] !== current) {
                await actor.update({ [`flags.darksheet.attributes.${track.path}`]: track.values[next] }, { diff: true });
                changed++;
            }
        }
        const labelMap = { food: "Hunger", water: "Thirst", fatigue: "Fatigue" };
        ui.notifications.notify(`Darksheet | ${labelMap[kind]} ${step > 0 ? "+" : ""}${step * magnitude} \u2014 ${changed} character${changed === 1 ? "" : "s"} updated.`);
        return changed;
    }
    static async changeDread(amount) {
        const screenData = await ensureDarkscreenFlags();
        const raw = screenData.dread ?? {};

        // Resolve the active zone - handles both new and legacy shapes.
        let store = raw;
        let usedLegacy = false;
        if (!store?.list || !store?.activeId) {
            // Legacy single-zone shape; lift it into the new store for this update.
            const id = "id_" + Math.random().toString(36).slice(2, 9);
            store = {
                list: { [id]: {
                    id,
                    name: raw.force || "Dread Zone",
                    force: raw.force ?? "",
                    zone: raw.zone ?? "",
                    current: Number(raw.current ?? 0),
                    max: Number(raw.max ?? 20),
                    custom: Array.isArray(raw.custom) ? raw.custom : []
                }},
                activeId: id,
                displayId: null
            };
            usedLegacy = true;
        }
        const active = store.list[store.activeId];
        if (!active) {
            ui.notifications.warn("Darksheet | No active dread zone.");
            return;
        }
        const max = Number(active.max ?? 20);
        const current = Number(active.current ?? max);
        const next = Math.max(0, Math.min(max, current + Number(amount || 0)));
        store.list[store.activeId] = { ...active, current: next, max };

        await setDarkscreenFlags({ ...screenData, dread: store });
        ui.notifications.notify(`Darksheet | ${active.name || "Dread"} ${next}/${max}`);
        Darksheet.darkScreenReload();
    }
    static async applyDarkscreenRest(actorId, lifestyleKey, primaryActivity = "") {
        const actor = game.actors.get(actorId);
        if (!actor) {
            ui.notifications.warn("Darksheet | Select a character first.");
            return;
        }

        const lifestyle = DARKSCREEN_LIFESTYLES[lifestyleKey];
        if (!lifestyle) return;

        // Apply lifestyle conditions + clear stress (Darker Dungeons long rest in sanctuary).
        await actor.update({
            'flags.darksheet.attributes.saturation': lifestyle.food,
            'flags.darksheet.attributes.thirst': lifestyle.water,
            'flags.darksheet.attributes.fatigue': lifestyle.fatigue,
            'flags.darksheet.attributes.stress': 0
        }, { diff: true });

        const activityLabels = {
            "work-coin": "Work for Coin", "work-renown": "Work for Renown", "spread-rumors": "Spread Rumors",
            "find-merchant": "Find a Rare Merchant", "sell-exotic": "Sell an Exotic Item", "craft": "Craft an Item",
            "learn-tool": "Learn a Tool", "research": "Research", "training": "Training",
            "carouse": "Carouse & Socialize", "rnr": "Rest & Relaxation", "volunteer": "Volunteer Work",
            "criminal": "Criminal Activity", "business": "Run a Business", "service": "Perform a Service",
            "language": "Learn a Language"
        };
        const activityText = activityLabels[primaryActivity] ? `<p><strong>Primary activity:</strong> ${activityLabels[primaryActivity]}</p>` : "";
        await Darksheet.postDarkscreenChat({
            title: `${actor.name}: ${lifestyle.label} Long Rest`,
            icon: "fa-solid fa-bed-pulse",
            actor,
            body: `<p>1 week in sanctuary. Lifestyle conditions applied, stress reset to 0.</p>${activityText}<p><em>Roll Complication (d10) and check Affliction Removal as needed.</em></p>`
        });
    }

    /* =====
 OUTSIDE CAMP - Darker Dungeons short rest helpers
 ===== */
    static async rollPartyCamping(dc = 10) {
        const party = Darksheet.journeyPartyActors();
        if (!party.length) {
            ui.notifications.warn("Darksheet | No player characters found.");
            return null;
        }
        const lines = [];
        let failures = 0;
        for (const actor of party) {
            const mod = Number(actor.system?.skills?.sur?.total ?? actor.system?.skills?.sur?.mod ?? 0);
            const roll = await new Roll(`1d20 + ${mod}`, actor.getRollData()).evaluate();
            const total = roll.total ?? roll._total;
            const success = total >= dc;
            if (!success) failures++;
            lines.push(`<strong>${actor.name}</strong>: ${total} vs DC ${dc} \u2014 ${success ? "\u2713" : "\u2717"}`);
        }
        const activityDc = failures === 0 ? 5 : failures === 1 ? 10 : 15;
        await Darksheet.postDarkscreenChat({
            title: `Camping Checks - DC ${dc}`,
            icon: "fa-solid fa-mountain-sun",
            whisper: "gm",
            body: `<p>${lines.join("<br>")}</p><p><strong>${failures} failure${failures === 1 ? "" : "s"}</strong> - Camp activity DC <strong>${activityDc}</strong></p>`
        });
        return { failures, activityDc };
    }

    static async rollLookout(actorId, dc = 10) {
        const actor = game.actors.get(actorId);
        if (!actor) return null;
        const mod = Number(actor.system?.skills?.sur?.total ?? actor.system?.skills?.sur?.mod ?? 0);
        const roll = await new Roll(`1d20 + ${mod}`, actor.getRollData()).evaluate();
        const total = roll.total ?? roll._total;
        const success = total >= dc;
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `Lookout \u2014 DC ${dc} ${success ? "\u2713 Defenses secured" : "\u2717 Disadvantage on perception vs intruders"}`
        });
        return { actorId, total, success };
    }

    static async rollPartySleep(dc = 10) {
        const party = Darksheet.journeyPartyActors();
        if (!party.length) return [];
        const lines = [];
        for (const actor of party) {
            const conMod = Number(actor.system?.abilities?.con?.mod ?? 0);
            // Sleeping with bedroll/tent gives advantage; we keep it simple and use straight d20.
            const roll = await new Roll(`1d20 + ${conMod}`, actor.getRollData()).evaluate();
            const total = roll.total ?? roll._total;
            const success = total >= dc;
            lines.push(`<strong>${actor.name}</strong>: ${total} vs DC ${dc} \u2014 ${success ? "\u2713 slept well (+1 hit die)" : "\u2717 restless"}`);
        }
        await Darksheet.postDarkscreenChat({
            title: `Sleep - DC ${dc}`,
            icon: "fa-solid fa-bed",
            whisper: "gm",
            body: `<p>${lines.join("<br>")}</p>`
        });
    }

    static async rollLongRestComplication(actorId) {
        const roll = await new Roll("1d10").evaluate();
        const total = roll.total ?? roll._total;
        const triggered = total === 1;
        const actor = actorId ? game.actors.get(actorId) : null;
        await roll.toMessage({
            speaker: actor ? ChatMessage.getSpeaker({ actor }) : undefined,
            flavor: `Long Rest Complication \u2014 ${triggered ? "\u26A0 Something unfortunate happens this week" : "No complication this week"}`
        });
    }

    static async rollRumors(count = 3) {
        const table = game.tables.contents.find(t => t.name === "Random Rumors");
        if (!table) {
            ui.notifications.warn("Darksheet | Roll table 'Random Rumors' not found.");
            return;
        }
        const lines = [];
        for (let i = 0; i < count; i++) {
            const draw = await table.draw({ displayChat: false });
            const result = draw?.results?.[0];
            if (result) {
                const source = darksheetTableResultSource(result);
                lines.push(`${i + 1}. ${result.name ?? source.name ?? result.description ?? source.description ?? source.text ?? "Rumor"}`);
            }
        }
        await Darksheet.postDarkscreenChat({
            title: "Rumors Heard This Week",
            icon: "fa-solid fa-comments",
            whisper: "gm",
            body: `<p>${lines.join("<br>")}</p>`
        });
    }
    /* =====
 MAGICAL ENCHANTMENTS - applied to dnd5e 5.x items
 ===== */
    static async applyItemEnchantment(itemUuid, form, calc) {
        const item = await fromUuid(itemUuid);
        if (!item?.update) {
            ui.notifications.warn("Darksheet | Drop an editable actor item first.");
            return;
        }

        const enchantment = {
            plus: Number(form.plus || 0),
            element: form.element || "",
            elementDice: form.dice || "",
            special: form.special || "",
            cost: calc.cost,
            time: calc.time,
            rarity: calc.rarity,
            rarityLabel: ["Mundane", "Common", "Uncommon", "Rare", "Very Rare", "Legendary"][calc.rarity] || "Mundane",
            appliedAt: Date.now()
        };

        const baseName = item.flags?.darksheet?.item?.baseName || item.name;
        const newName = (() => {
            let n = baseName;
            if (enchantment.plus > 0) n = `${n} +${enchantment.plus}`;
            if (enchantment.element && enchantment.elementDice) n = `${enchantment.element.charAt(0).toUpperCase() + enchantment.element.slice(1)} ${n}`;
            const suffixes = {
                improvedCrit: " of Keenness", superiorCrit: " of Sharpness", luck: " of Luck",
                dancing: " (Dancing)", returning: " (Returning)", ofWarning: " of Warning", vorpal: " (Vorpal)"
            };
            if (suffixes[enchantment.special]) n += suffixes[enchantment.special];
            return n;
        })();

        const updateData = {
            name: newName,
            'flags.darksheet.item.baseName': baseName,
            'flags.darksheet.item.enchantment': enchantment
        };

        const finalValue = Number(calc.finalValue ?? 0);
        if (finalValue > 0 && item.system?.price && typeof item.system.price === "object" && "value" in item.system.price) {
            updateData['system.price.value'] = Math.round(finalValue * 100) / 100;
        }

        // Try to apply mechanical effects on the dnd5e 5.x weapon data shape.
        try {
            if (item.type === "weapon") {
                // Mark the item magical
                if (item.system?.properties) {
                    const props = foundry.utils.deepClone(item.system.properties);
                    if (Array.isArray(props)) {
                        if (!props.includes("mgc")) props.push("mgc");
                        updateData['system.properties'] = props;
                    } else if (typeof props === "object") {
                        props.mgc = true;
                        updateData['system.properties'] = props;
                    }
                }
                // Enhancement bonus -> magicalBonus
                if (enchantment.plus > 0) {
                    updateData['system.magicalBonus'] = enchantment.plus;
                }
                // Elemental damage -> push an extra damage part
                if (enchantment.element && enchantment.elementDice) {
                    const damage = foundry.utils.deepClone(item.system?.damage ?? {});
                    damage.parts = Array.isArray(damage.parts) ? [...damage.parts] : [];
                    damage.parts.push([`${enchantment.elementDice}[${enchantment.element}]`, enchantment.element]);
                    updateData['system.damage'] = damage;
                }
                // Crit improvements
                if (enchantment.special === "improvedCrit") updateData['system.critical.threshold'] = 19;
                if (enchantment.special === "superiorCrit") updateData['system.critical.threshold'] = 18;
                if (enchantment.special === "vorpal") {
                    updateData['system.critical.threshold'] = 18;
                    updateData['system.critical.damage'] = "20";   // vorpal-flavoured extra crit dmg
                }
            }
            // Rarity flag if dnd5e supports it
            if (item.system?.rarity !== undefined) {
                const rarityKey = ["", "common", "uncommon", "rare", "veryRare", "legendary"][enchantment.rarity] || "";
                if (rarityKey) updateData['system.rarity'] = rarityKey;
            }
        } catch (e) {
            console.warn("Darksheet | Mechanical enchantment apply failed (non-fatal):", e);
        }

        if (form.copy) {
            const source = item.toObject();
            delete source._id;
            for (const [path, value] of Object.entries(updateData)) foundry.utils.setProperty(source, path, value);
            source.name = newName;
            if (item.parent?.createEmbeddedDocuments) await item.parent.createEmbeddedDocuments("Item", [source]);
            else await Item.create(source);
            ui.notifications.notify(`Darksheet | Crafted ${newName} (${enchantment.rarityLabel}).`);
        } else {
            await item.update(updateData, { diff: true });
            ui.notifications.notify(`Darksheet | Enchanted ${newName} (${enchantment.rarityLabel}).`);
        }

        // Chat summary
        const parts = [];
        if (enchantment.plus > 0) parts.push(`Enhancement <strong>+${enchantment.plus}</strong>`);
        if (enchantment.element && enchantment.elementDice) parts.push(`<strong>${enchantment.elementDice}</strong> ${enchantment.element} damage`);
        if (enchantment.special) parts.push(`Property: <strong>${enchantment.special.replace(/([A-Z])/g, " $1").replace(/^./, m => m.toUpperCase())}</strong>`);
        await Darksheet.postDarkscreenChat({
            title: newName,
            icon: "fa-solid fa-wand-magic-sparkles",
            body: `<p><em>${enchantment.rarityLabel} - ${enchantment.cost.toLocaleString()} gp, ${enchantment.time} day${enchantment.time === 1 ? "" : "s"} of crafting.</em></p>
                <p>${parts.join(" - ") || "-"}</p>`
        });

        Darksheet.darkScreenReload();
    }

    static async stripItemEnchantment(itemUuid) {
        const item = await fromUuid(itemUuid);
        if (!item?.update) return;
        const baseName = item.flags?.darksheet?.item?.baseName || item.name.replace(/\s*[+\-]\d+|\s*\((Vorpal|Dancing|Returning)\)|\s*of\s+(Keenness|Sharpness|Luck|Warning)|^(Fire|Cold|Lightning|Thunder|Acid|Poison|Radiant|Necrotic|Force|Psychic)\s+/gi, "").trim();
        const updateData = {
            name: baseName,
            'flags.darksheet.item.-=enchantment': null,
            'flags.darksheet.item.-=baseName': null
        };
        if (item.type === "weapon") {
            updateData['system.magicalBonus'] = 0;
            updateData['system.critical.threshold'] = null;
            updateData['system.critical.damage'] = "";
        }
        await item.update(updateData, { diff: true });
        ui.notifications.notify(`Darksheet | Stripped enchantments from ${baseName}.`);
        Darksheet.darkScreenReload();
    }

    /* =====
 CAMPFIRE - shared resting dialog with player activity picks + self-rolls
 ===== */
    static async openCampfire() {
        await ensureCampfireState({ active: true, started: Date.now(), lit: false });
        DarksheetCampfire.openLocal();
        // Broadcast to all clients so players see the dialog open too.
        game.socket.emit("module.darksheet", { type: "campfireOpen" });
    }

    static async requestCampRoles(dc = 10) {
        const party = Darksheet.journeyPartyActors();
        if (!party.length) {
            ui.notifications.warn("Darksheet | No player characters found.");
            return null;
        }

        const state = await ensureCampSetupState({
            active: true,
            started: Date.now(),
            dc,
            activityDc: null,
            finalizedAt: null,
            players: {}
        });
        await ensureCampfireState({ active: false, lit: false, activityDc: null, players: {} });

        DarksheetCampSetup.openLocal();
        game.socket.emit("module.darksheet", { type: "campSetupOpen" });
        game.socket.emit("module.darksheet", { type: "campSetupUpdate", state });

        await Darksheet.postDarkscreenChat({
            title: "Camp Setup Requested",
            icon: "fa-solid fa-campground",
            body: `<p>Choose how you help set up camp and roll your Camping check.</p><p><strong>Camping DC:</strong> ${dc}</p>`
        });

        return { activityDc: null };
    }

    static async updateCampSetupPlayer(actorId, patch = {}) {
        if (!game.user.isGM) { game.socket.emit("module.darksheet", { type: "campStateWrite", op: "updateCampSetupPlayer", args: [actorId, patch] }); return; }
        const state = await getCampSetupState();
        state.players ??= {};
        state.players[actorId] = { ...(state.players[actorId] ?? {}), ...patch };
        const resetSetup = Object.prototype.hasOwnProperty.call(patch, "role") || Object.prototype.hasOwnProperty.call(patch, "rollResult");
        if (resetSetup) {
            state.activityDc = null;
            state.finalizedAt = null;
        }
        await setCampSetupState(state);
        if (resetSetup) await ensureCampfireState({ activityDc: null });
        game.socket.emit("module.darksheet", { type: "campSetupUpdate", state });
        DarksheetCampSetup.applyState(state);
        await Darksheet._finalizeCampSetupIfReady();
    }

    static async rollCampSetupRole(actorId, { disadvantage = false } = {}) {
        const actor = game.actors.get(actorId);
        const state = await getCampSetupState();
        const playerState = state.players?.[actorId];
        if (!actor || !playerState?.role) return;
        const role = CAMP_SETUP_ROLES[playerState.role];
        if (!role) return;

        if (playerState.role !== "survival") {
            const alreadyUsed = Object.entries(state.players ?? {}).some(([id, other]) => id !== actorId && other.role === playerState.role);
            if (alreadyUsed) {
                ui.notifications.warn(`Darksheet | ${role.label} can only be used by one camper during setup.`);
                return;
            }
        }

        const skill = actor.system?.skills?.[role.skill];
        const mod = Number(skill?.total ?? skill?.mod ?? 0);
        const formula = `${disadvantage ? "2d20kl" : "1d20"} ${mod >= 0 ? "+" : ""} ${mod}`;
        const dc = Number(state.dc ?? 10);
        const roll = await new Roll(formula, actor.getRollData()).evaluate();
        const total = roll.total ?? roll._total;
        const success = total >= dc;

        await Darksheet.updateCampSetupPlayer(actorId, {
            rollResult: total,
            rollFormula: formula,
            disadvantage,
            success,
            rolledAt: Date.now()
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `Camp Setup - ${role.label}${disadvantage ? " (disadvantage: no camping gear)" : ""}, DC ${dc} ${success ? "success" : "failure"}`
        });

        return { actorId, total, success };
    }

    static async _finalizeCampSetupIfReady() {
        if (!game.user.isGM) return null;
        const party = Darksheet.journeyPartyActors();
        const state = await getCampSetupState();
        const players = state.players ?? {};
        if (state.finalizedAt) return null;
        if (!party.length || party.some(actor => players[actor.id]?.rollResult == null)) return null;

        const hasSurvival = party.some(actor => players[actor.id]?.role === "survival");
        const failures = party.reduce((count, actor) => count + (players[actor.id]?.success ? 0 : 1), 0);
        const activityDc = failures === 0 ? 5 : failures === 1 ? 10 : 15;
        state.activityDc = activityDc;
        state.finalizedAt = Date.now();
        await setCampSetupState(state);
        await ensureCampfireState({ activityDc });

        const lines = party.map(actor => {
            const entry = players[actor.id] ?? {};
            const role = CAMP_SETUP_ROLES[entry.role]?.label ?? "Unassigned";
            return `<strong>${actor.name}</strong>: ${role}${entry.disadvantage ? " (disadvantage)" : ""} ${entry.rollResult} vs DC ${state.dc} \u2014 ${entry.success ? "\u2713" : "\u2717"}`;
        });
        const survivalWarning = hasSurvival ? "" : "<p><em>No Survival check was made; Darker Dungeons requires at least one Survival-based Camping check.</em></p>";

        await Darksheet.postDarkscreenChat({
            title: "Camp Setup Complete",
            icon: "fa-solid fa-campground",
            whisper: "gm",
            body: `<p>${lines.join("<br>")}</p><p><strong>${failures} failure${failures === 1 ? "" : "s"}</strong> - Camp activity DC <strong>${activityDc}</strong></p>${survivalWarning}`
        });

        game.socket.emit("module.darksheet", { type: "campSetupUpdate", state });
        DarksheetCampSetup.applyState(state);
        return { failures, activityDc };
    }

    static async closeCampfire() {
        await setCampfireState({ active: false });
        DarksheetCampfire.closeLocal();
        game.socket.emit("module.darksheet", { type: "campfireClose" });
    }

    static async closeCampSetup() {
        await setCampSetupState({ active: false });
        if (DarksheetCampSetup._dialog?.rendered) DarksheetCampSetup._dialog.close({ force: true });
        DarksheetCampSetup._dialog = null;
        game.socket.emit("module.darksheet", { type: "campSetupClose" });
    }

    static async packUpCamp() {
        await Darksheet.closeCampSetup();
        await Darksheet.closeCampfire();
        ui.notifications.notify("Darksheet | Camp packed up.");
    }

    static async updateCampfirePlayer(actorId, patch = {}) {
        if (!game.user.isGM) { game.socket.emit("module.darksheet", { type: "campStateWrite", op: "updateCampfirePlayer", args: [actorId, patch] }); return; }
        const state = await getCampfireState();
        state.players ??= {};
        state.players[actorId] = { ...(state.players[actorId] ?? {}), ...patch };
        await setCampfireState(state);
        game.socket.emit("module.darksheet", { type: "campfireUpdate", state });
        DarksheetCampfire.applyState(state);
    }

    static async lightCampfire() {
        if (!game.user.isGM) { game.socket.emit("module.darksheet", { type: "campStateWrite", op: "lightCampfire", args: [] }); return; }
        const state = await getCampfireState();
        state.lit = !state.lit;
        await setCampfireState(state);
        game.socket.emit("module.darksheet", { type: "campfireUpdate", state });
        DarksheetCampfire.applyState(state);
    }

    static async rollCampfireActivity(actorId) {
        const actor = game.actors.get(actorId);
        const state = await getCampfireState();
        const playerState = state.players?.[actorId];
        if (!actor || !playerState?.activity) return;
        const activity = CAMP_ACTIVITIES[playerState.activity];
        if (!activity) return;

        // Camp activity DC - default 10 (a "decent campsite" per Darker Dungeons).
        const dc = Number(state.activityDc ?? 10);
        let total = null;
        let success = true;
        let rollRender = "";
        let formula = null;

        if (activity.skill) {
            const skill = actor.system?.skills?.[activity.skill];
            const mod = Number(skill?.total ?? skill?.mod ?? 0);
            formula = `1d20 ${mod >= 0 ? "+" : ""} ${mod}`;
            const roll = await new Roll(formula, actor.getRollData()).evaluate();
            total = roll.total ?? roll._total;
            success = total >= dc;
            rollRender = await roll.render();
        }

        const outcome = success
            ? await Darksheet._applyCampActivityEffect(actor, activity)
            : { text: `<em>Failure vs DC ${dc}.</em>` };

        await Darksheet.updateCampfirePlayer(actorId, {
            rollResult: total,
            rollFormula: formula,
            rolledAt: Date.now()
        });
        await Darksheet.postDarkscreenChat({
            title: `${actor.name} - ${activity.label}${activity.skill ? ` (${activity.skill}, DC ${dc})` : ""}`,
            icon: `fa-solid ${activity.icon}`,
            actor,
            body: `${rollRender}<p>${outcome.text}</p>`
        });
        return total;
    }

    static async _applyCampActivityEffect(actor, activity) {
        switch (activity.effect) {
            case "hitdie": {
                // Try to refund a spent hit die (dnd5e 5.x stores per-class).
                const classes = actor.system?.classes ?? {};
                for (const [key, cls] of Object.entries(classes)) {
                    const used = Number(cls.hitDiceUsed ?? 0);
                    if (used > 0) {
                        await actor.update({ [`system.classes.${key}.hitDiceUsed`]: used - 1 });
                        return { text: `Regained <strong>1 hit die</strong> (${key}, ${used} \u2192 ${used - 1}).` };
                    }
                }
                return { text: "Already at full hit dice." };
            }
            case "stressSelf": {
                const roll = await new Roll("1d4").evaluate();
                const delta = roll.total ?? roll._total;
                await darksheetEnsureFlags(actor);
                const current = Number(actor.flags?.darksheet?.attributes?.stress ?? 0);
                const next = Math.max(0, current - delta);
                if (next !== current) await actor.update({ 'flags.darksheet.attributes.stress': next });
                return { text: `\u{1F3B2} <strong>1d4 = ${delta}</strong>. Stress ${current} \u2192 ${next}.` };
            }
            case "stressParty": {
                const party = Darksheet.journeyPartyActors();
                const roll = await new Roll("1d4").evaluate();
                const delta = roll.total ?? roll._total;
                const lines = [];
                for (const a of party) {
                    await darksheetEnsureFlags(a);
                    const current = Number(a.flags?.darksheet?.attributes?.stress ?? 0);
                    const next = Math.max(0, current - delta);
                    if (next !== current) {
                        await a.update({ 'flags.darksheet.attributes.stress': next });
                        lines.push(`${a.name}: ${current} \u2192 ${next}`);
                    }
                }
                return { text: `\u{1F3B2} <strong>1d4 = ${delta}</strong>. Party stress reduced:<br>${lines.length ? lines.join("<br>") : "<em>Nobody had stress to reduce.</em>"}` };
            }
            case "mend": {
                const item = await Darksheet._promptCampMend(actor);
                if (!item) return { text: "<em>No notched item selected.</em>" };
                const notches = Number(item.flags?.darksheet?.item?.notches ?? 0);
                if (notches <= 0) return { text: `<strong>${item.name}</strong> has no notches.` };
                await item.update({ 'flags.darksheet.item.notches': notches - 1 });
                return { text: `Mended <strong>${item.name}</strong>: ${notches} \u2192 ${notches - 1} notch${notches - 1 === 1 ? "" : "es"}.` };
            }
            case "tendWound": {
                const picked = await Darksheet._promptCampTendWound(actor);
                if (!picked) return { text: "<em>No untreated wound to tend.</em>" };
                const list = foundry.utils.deepClone(actor.flags?.darksheet?.woundlist ?? []);
                if (!list[picked.index]) return { text: "<em>Wound vanished.</em>" };
                list[picked.index].treated = true;
                await actor.update({ 'flags.darksheet.woundlist': list });
                return { text: `Treated wound: <strong>${list[picked.index].location || `Wound ${picked.index + 1}`}</strong>.` };
            }
            case "inspiration": {
                await actor.update({ 'system.attributes.inspiration': true });
                return { text: "Gained <strong>Inspiration</strong>." };
            }
            case "rations": {
                const roll = await new Roll("1d4 + 1").evaluate();
                const total = roll.total ?? roll._total;
                return { text: `Foraged <strong>${total}</strong> ration${total === 1 ? "" : "s"} (food/water).` };
            }
            case "watch":
                return { text: "On lookout duty \u2014 alert for intruders this turn." };
            default:
                return { text: "Activity complete." };
        }
    }

    static async _promptCampMend(actor) {
        const items = (actor.items?.contents ?? []).filter(i => Number(i.flags?.darksheet?.item?.notches ?? 0) > 0);
        if (!items.length) {
            ui.notifications.info(`Darksheet | ${actor.name} has no notched items to mend.`);
            return null;
        }
        return new Promise(resolve => {
            const options = items.map(i => {
                const notches = Number(i.flags?.darksheet?.item?.notches ?? 0);
                return `<option value="${i.id}">${i.name} \u2014 ${notches} notch${notches === 1 ? "" : "es"}</option>`;
            }).join("");
            new Dialog({
                title: `${actor.name}: Mend Item`,
                content: `<form><div class="form-group"><label>Pick an item to mend (-1 notch)<br><select name="itemId" style="width:100%; margin-top:6px">${options}</select></label></div></form>`,
                buttons: {
                    ok: { label: "Mend", icon: '<i class="fas fa-screwdriver-wrench"></i>', callback: html => {
                        const id = html[0].querySelector('select[name="itemId"]').value;
                        resolve(actor.items.get(id) ?? null);
                    }},
                    cancel: { label: "Cancel", icon: '<i class="fas fa-xmark"></i>', callback: () => resolve(null) }
                },
                default: "ok",
                close: () => resolve(null)
            }).render(true);
        });
    }

    static async _promptCampTendWound(actor) {
        const list = actor.flags?.darksheet?.woundlist ?? [];
        const wounds = list
            .map((w, i) => ({ ...w, index: i }))
            .filter(w => !w.healed && !w.treated);
        if (!wounds.length) {
            ui.notifications.info(`Darksheet | ${actor.name} has no untreated wounds.`);
            return null;
        }
        if (wounds.length === 1) return wounds[0];
        return new Promise(resolve => {
            const options = wounds.map(w =>
                `<option value="${w.index}">${w.location || `Wound ${w.index + 1}`}</option>`
            ).join("");
            new Dialog({
                title: `${actor.name}: Tend Wound`,
                content: `<form><div class="form-group"><label>Pick a wound to treat<br><select name="woundIdx" style="width:100%; margin-top:6px">${options}</select></label></div></form>`,
                buttons: {
                    ok: { label: "Treat", icon: '<i class="fas fa-staff-snake"></i>', callback: html => {
                        const idx = Number(html[0].querySelector('select[name="woundIdx"]').value);
                        resolve(wounds.find(w => w.index === idx) ?? null);
                    }},
                    cancel: { label: "Cancel", icon: '<i class="fas fa-xmark"></i>', callback: () => resolve(null) }
                },
                default: "ok",
                close: () => resolve(null)
            }).render(true);
        });
    }

    /* =====
 CITY LONG REST - Darker Dungeons "1 week in sanctuary" party dialog
 ===== */
    static async openCityRest() {
        await ensureCityRestState({ active: true, started: Date.now() });
        DarksheetCityRest.openLocal();
        game.socket.emit("module.darksheet", { type: "cityRestOpen" });
    }

    static async closeCityRest() {
        await ensureCityRestState({ active: false, players: {} });
        DarksheetCityRest.closeLocal();
        game.socket.emit("module.darksheet", { type: "cityRestClose" });
    }

    static async setCityRestLifestyle(key) {
        if (!DARKSCREEN_LIFESTYLES[key]) return;
        if (!game.user.isGM) { game.socket.emit("module.darksheet", { type: "campStateWrite", op: "setCityRestLifestyle", args: [key] }); return; }
        const state = await getCityRestState();
        state.lifestyle = key;
        await setCityRestState(state);
        game.socket.emit("module.darksheet", { type: "cityRestUpdate", state });
        DarksheetCityRest.applyState(state);
    }

    static async updateCityRestPlayer(actorId, patch = {}) {
        if (!game.user.isGM) { game.socket.emit("module.darksheet", { type: "campStateWrite", op: "updateCityRestPlayer", args: [actorId, patch] }); return; }
        const state = await getCityRestState();
        state.players ??= {};
        state.players[actorId] = { ...(state.players[actorId] ?? {}), ...patch };
        await setCityRestState(state);
        game.socket.emit("module.darksheet", { type: "cityRestUpdate", state });
        DarksheetCityRest.applyState(state);
    }

    static async rollCityRestActivity(actorId) {
        const actor = game.actors.get(actorId);
        const state = await getCityRestState();
        const playerState = state.players?.[actorId];
        if (!actor || !playerState?.activity) return;
        const activity = LONG_REST_ACTIVITIES[playerState.activity];
        if (!activity) return;

        let total = null;
        let formula = null;
        let rollRender = "";
        let resultText = "";

        if (activity.autoHealStress) {
            // Rest & Relaxation - automatic 2d6 stress reduction, no check.
            const roll = await new Roll("2d6").evaluate();
            total = roll.total ?? roll._total;
            formula = "2d6";
            rollRender = await roll.render();
            await darksheetEnsureFlags(actor);
            const cur = Number(actor.flags?.darksheet?.attributes?.stress ?? 0);
            const next = Math.max(0, cur - total);
            if (next !== cur) await actor.update({ 'flags.darksheet.attributes.stress': next });
            resultText = `Stress healed: <strong>${cur} \u2192 ${next}</strong> (\u2013${total}).`;
        } else {
            // Skill-based or ability-based check.
            let mod = 0;
            let label = activity.label;
            if (activity.skill) {
                const skill = actor.system?.skills?.[activity.skill];
                mod = Number(skill?.total ?? skill?.mod ?? 0);
                label += ` (${activity.skill})`;
            } else if (activity.ability) {
                mod = Number(actor.system?.abilities?.[activity.ability]?.mod ?? 0);
                label += ` (${activity.ability.toUpperCase()})`;
            }
            formula = `1d20 ${mod >= 0 ? "+" : ""} ${mod}`;
            const roll = await new Roll(formula, actor.getRollData()).evaluate();
            total = roll.total ?? roll._total;
            rollRender = await roll.render();
            resultText = `${actor.name} pursued <strong>${label}</strong>.`;
        }

        await Darksheet.updateCityRestPlayer(actorId, {
            rollResult: total,
            rollFormula: formula,
            rolledAt: Date.now()
        });
        await Darksheet.postDarkscreenChat({
            title: `${actor.name} - ${activity.label}`,
            icon: `fa-solid ${activity.icon}`,
            actor,
            body: `${rollRender}<p>${resultText}</p>`
        });
        return total;
    }

    static async endCityRest() {
        const state = await getCityRestState();
        const defaultLifestyle = state.lifestyle || "comfortable";
        const party = Darksheet.journeyPartyActors();
        if (!party.length) {
            ui.notifications.warn("Darksheet | No player characters found.");
            return;
        }
        // Apply each player's chosen lifestyle (falling back to the default) + reset stress.
        const lines = [];
        for (const actor of party) {
            const playerState = state.players?.[actor.id] ?? {};
            const lifestyleKey = playerState.lifestyle || defaultLifestyle;
            const lifestyle = DARKSCREEN_LIFESTYLES[lifestyleKey];
            await Darksheet.applyDarkscreenRest(actor.id, lifestyleKey, playerState.activity || "");
            const actLabel = playerState.activity ? LONG_REST_ACTIVITIES[playerState.activity]?.label : "no activity";
            lines.push(`<strong>${actor.name}</strong>: ${lifestyle?.label || lifestyleKey} \u2014 ${actLabel}`);
        }
        // Roll one party-wide complication d10.
        const roll = await new Roll("1d10").evaluate();
        const total = roll.total ?? roll._total;
        const triggered = total === 1;
        await Darksheet.postDarkscreenChat({
            title: "End of Week - Long Rest",
            icon: "fa-solid fa-bed-pulse",
            body: `<p>${lines.join("<br>")}</p><p>Complication d10 = <strong>${total}</strong> - ${triggered ? "<strong>Something unfortunate happened this week.</strong>" : "No complication."}</p>`
        });
        await Darksheet.closeCityRest();
    }

    static async applyItemTemper(itemUuid, temperKey, repairCount = 0, createCopy = false, overallQuality = "keep") {
        const item = await fromUuid(itemUuid);
        if (!item?.update) {
            ui.notifications.warn("Darksheet | Drop an editable actor item first.");
            return;
        }

        const temper = DARKSCREEN_TEMPERING[temperKey];
        if (!temper) return;

        const baseValue = getDarkscreenItemPrice(item);
        const repairNotches = Math.max(0, Number(repairCount || 0));
        const currentNotches = Number(item.flags?.darksheet?.item?.notches ?? 0);
        const newNotches = Math.max(0, currentNotches - repairNotches);
        const updateData = {
            'flags.darksheet.item.temper': temper.flag,
            'flags.darksheet.item.notches': newNotches
        };

        // Overall quality restoration is separate from notch repair in Darker Dungeons.
        // Restoring appearance costs 10/30/50% per grade and takes 1 week per grade;
        // this button applies the tracked result, while the screen estimates cost/time.
        const validQualities = ["pristine", "worn", "well-worn", "scarred"];
        if (validQualities.includes(overallQuality)) {
            const currentQuality = item.flags?.darksheet?.item?.quality || "pristine";
            const currentRank = DARKSCREEN_ITEM_QUALITY_ORDER.indexOf(currentQuality);
            const targetRank = DARKSCREEN_ITEM_QUALITY_ORDER.indexOf(overallQuality);
            if (currentRank < 0 || targetRank < 0 || targetRank <= currentRank) {
                updateData['flags.darksheet.item.quality'] = overallQuality;
            }
        }

        if (baseValue > 0 && item.system?.price && typeof item.system.price === "object" && "value" in item.system.price) {
            updateData['system.price.value'] = Math.round((baseValue * temper.valueMultiplier) * 100) / 100;
        }

        if (createCopy) {
            const source = item.toObject();
            delete source._id;
            source.name = temper.flag ? `${temper.label} ${item.name}` : `${item.name} (Repaired)`;
            for (const [path, value] of Object.entries(updateData)) foundry.utils.setProperty(source, path, value);

            if (item.parent?.createEmbeddedDocuments) {
                await item.parent.createEmbeddedDocuments("Item", [source]);
            } else {
                await Item.create(source);
            }
            ui.notifications.notify(`Darksheet | Crafted ${source.name}.`);
        } else {
            await item.update(updateData, { diff: true });
            ui.notifications.notify(`Darksheet | Updated ${item.name}.`);
        }
        Darksheet.darkScreenReload();
    }
    static async darkScreenReload() {
        if (!this._darkscreen?.rendered) {
            Darkscreen.initializeDarkscreen();
            return;
        }
        await this._darkscreen.render({ force: true, parts: ["screen"] });
    }
    static _darkscreen;
}

const DARKSCREEN_TEMPERING = {
    none: { label: "No Temper", flag: "", costMultiplier: 0, valueMultiplier: 1, time: "None" },
    Pure: { label: "Pure Temper", flag: "Pure", costMultiplier: 2, valueMultiplier: 3, time: "3 days" },
    Royal: { label: "Royal Temper", flag: "Royal", costMultiplier: 4, valueMultiplier: 6, time: "1 week" },
    Astral: { label: "Astral Temper", flag: "Astral", costMultiplier: 8, valueMultiplier: 12, time: "2 weeks" }
};

const DARKSCREEN_ITEM_QUALITY_ORDER = ["pristine", "worn", "well-worn", "scarred"];

const DARKSCREEN_LIFESTYLES = {
    wretched: { label: "Wretched", cost: 0, hp: "50%", hitDice: "0", food: "foodstarving", water: "wdehydrated", fatigue: "exbarely" },
    squalid: { label: "Squalid", cost: 0.5, hp: "50%", hitDice: "25%", food: "foodravenous", water: "wdry", fatigue: "exvsleepy" },
    poor: { label: "Poor", cost: 1.5, hp: "75%", hitDice: "50%", food: "foodhungry", water: "wthirsty", fatigue: "exsleepy" },
    modest: { label: "Modest", cost: 8, hp: "100%", hitDice: "75%", food: "foodpekish", water: "wparched", fatigue: "extired" },
    comfortable: { label: "Comfortable", cost: 15, hp: "100%", hitDice: "100%", food: "foodok", water: "wok", fatigue: "exok" },
    wealthy: { label: "Wealthy", cost: 30, hp: "110%", hitDice: "100%", food: "foodwellfed", water: "wrefreshed", fatigue: "exwell" },
    aristocratic: { label: "Aristocratic", cost: 70, hp: "120%", hitDice: "100%", food: "foodstuffed", water: "wquenched", fatigue: "exenegised" }
};

function getDarkscreenItemPrice(item) {
    const price = item.system?.price;
    if (typeof price === "number") return price;
    if (typeof price?.value === "number") return price.value;
    const parsed = Number(price?.value ?? price ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}


//DARKSCREEN
class Darkscreen {
    static dsc;

    static addChatControl() {
        this.addUiButton();
    }

    static addUiButton() {
        if (!game.user?.isGM) return;
        Darkscreen.bindUiButtonPositioning();

        const existingButton = document.getElementById("DarkScreen-button");
        if (existingButton) {
            Darkscreen.bindUiButtonDragging(existingButton);
            Darkscreen.scheduleUiButtonPosition();
            return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.id = "DarkScreen-button";
        button.className = "darkscreen-launcher";
        button.dataset.tooltip = "Darker Dungeons GM Screen (drag to move)";
        button.setAttribute("aria-label", "Open Darkscreen");
        button.innerHTML = `<i class="fas fa-book-dead" inert></i>`;
        button.addEventListener("click", event => {
            event.preventDefault();
            if (button.dataset.dragMoved === "true") {
                delete button.dataset.dragMoved;
                return;
            }
            Darkscreen.initializeDarkscreen();
        });
        Darkscreen.bindUiButtonDragging(button);

        document.body.append(button);
        Darkscreen.scheduleUiButtonPosition();
    }

    static bindUiButtonPositioning() {
        if (Darkscreen._uiButtonPositioningBound) return;
        Darkscreen._uiButtonPositioningBound = true;
        const reposition = () => Darkscreen.scheduleUiButtonPosition();
        window.addEventListener("resize", reposition);
        Hooks.on("renderHotbar", reposition);
        Hooks.on("collapseHotbar", reposition);
        Hooks.on("renderSceneControls", reposition);
        Hooks.on("controlToken", reposition);
        Hooks.on("canvasReady", reposition);
    }

    static scheduleUiButtonPosition() {
        if (Darkscreen._uiButtonPositionFrame) cancelAnimationFrame(Darkscreen._uiButtonPositionFrame);
        Darkscreen._uiButtonPositionFrame = requestAnimationFrame(() => {
            Darkscreen._uiButtonPositionFrame = null;
            Darkscreen.positionUiButton();
        });
    }

    static positionUiButton() {
        const button = document.getElementById("DarkScreen-button");
        if (!button) return;

        const buttonRect = button.getBoundingClientRect();
        const saved = Darkscreen.readUiButtonPosition();
        if (saved) {
            const point = Darkscreen.clampUiButtonPosition(saved.left, saved.top, buttonRect);
            Darkscreen.applyUiButtonPosition(button, point.left, point.top, "custom");
            return;
        }

        const hotbar = document.getElementById("hotbar");
        if (!hotbar) {
            const point = Darkscreen.findClearUiButtonPosition(12, window.innerHeight - buttonRect.height - 118, buttonRect);
            Darkscreen.applyUiButtonPosition(button, point.left, point.top, "auto");
            return;
        }

        const hotbarRect = hotbar.getBoundingClientRect();
        const gap = 8;
        let left = hotbarRect.left - buttonRect.width - gap;
        if (left < gap) {
            left = Math.min(
                window.innerWidth - buttonRect.width - gap,
                hotbarRect.right + gap
            );
        }
        const top = Math.max(
            gap,
            Math.min(
                window.innerHeight - buttonRect.height - gap,
                hotbarRect.top + ((hotbarRect.height - buttonRect.height) / 2)
            )
        );
        const point = Darkscreen.findClearUiButtonPosition(left, top, buttonRect);

        Darkscreen.applyUiButtonPosition(button, point.left, point.top, "hotbar");
    }

    static bindUiButtonDragging(button) {
        if (!button || button.dataset.darkscreenDragBound === "true") return;
        button.dataset.darkscreenDragBound = "true";
        button.addEventListener("pointerdown", event => {
            if (event.button !== 0) return;
            const rect = button.getBoundingClientRect();
            Darkscreen._uiButtonDrag = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                left: rect.left,
                top: rect.top,
                moved: false
            };
            button.setPointerCapture?.(event.pointerId);
            button.classList.add("is-dragging");
        });
        button.addEventListener("pointermove", event => Darkscreen.dragUiButton(event, button));
        button.addEventListener("pointerup", event => Darkscreen.endUiButtonDrag(event, button));
        button.addEventListener("pointercancel", event => Darkscreen.endUiButtonDrag(event, button));
    }

    static dragUiButton(event, button) {
        const drag = Darkscreen._uiButtonDrag;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        if (!drag.moved) return;
        event.preventDefault();
        const rect = button.getBoundingClientRect();
        const point = Darkscreen.clampUiButtonPosition(drag.left + dx, drag.top + dy, rect);
        Darkscreen.applyUiButtonPosition(button, point.left, point.top, "custom");
    }

    static endUiButtonDrag(event, button) {
        const drag = Darkscreen._uiButtonDrag;
        if (!drag || drag.pointerId !== event.pointerId) return;
        Darkscreen._uiButtonDrag = null;
        button.releasePointerCapture?.(event.pointerId);
        button.classList.remove("is-dragging");
        if (!drag.moved) return;
        button.dataset.dragMoved = "true";
        const rect = button.getBoundingClientRect();
        const point = Darkscreen.clampUiButtonPosition(rect.left, rect.top, rect);
        Darkscreen.applyUiButtonPosition(button, point.left, point.top, "custom");
        Darkscreen.writeUiButtonPosition(point.left, point.top);
    }

    static findClearUiButtonPosition(left, top, buttonRect) {
        const gap = 8;
        let point = Darkscreen.clampUiButtonPosition(left, top, buttonRect);
        for (const obstacle of Darkscreen.getUiButtonObstacleRects()) {
            if (!Darkscreen.rectsOverlap(point, buttonRect, obstacle, gap)) continue;
            const right = obstacle.right + gap;
            const below = obstacle.bottom + gap;
            const above = obstacle.top - buttonRect.height - gap;
            const candidates = [
                { left: right, top: point.top },
                { left: point.left, top: below },
                { left: point.left, top: above }
            ].map(candidate => Darkscreen.clampUiButtonPosition(candidate.left, candidate.top, buttonRect));
            point = candidates.find(candidate => !Darkscreen.getUiButtonObstacleRects().some(rect => Darkscreen.rectsOverlap(candidate, buttonRect, rect, gap)))
                ?? candidates[0]
                ?? point;
        }
        return point;
    }

    static getUiButtonObstacleRects() {
        const selectors = ["#controls", "#scene-controls", "#tools-panel", "#ui-left #controls"];
        const seen = new Set();
        return selectors
            .flatMap(selector => Array.from(document.querySelectorAll(selector)))
            .filter(element => {
                if (seen.has(element)) return false;
                seen.add(element);
                const style = getComputedStyle(element);
                return style.display !== "none" && style.visibility !== "hidden";
            })
            .map(element => element.getBoundingClientRect())
            .filter(rect => rect.width > 0 && rect.height > 0);
    }

    static rectsOverlap(point, buttonRect, rect, gap = 0) {
        const left = point.left - gap;
        const right = point.left + buttonRect.width + gap;
        const top = point.top - gap;
        const bottom = point.top + buttonRect.height + gap;
        return left < rect.right && right > rect.left && top < rect.bottom && bottom > rect.top;
    }

    static clampUiButtonPosition(left, top, buttonRect) {
        const gap = 8;
        return {
            left: Math.max(gap, Math.min(window.innerWidth - buttonRect.width - gap, left)),
            top: Math.max(gap, Math.min(window.innerHeight - buttonRect.height - gap, top))
        };
    }

    static applyUiButtonPosition(button, left, top, mode = "auto") {
        button.style.left = `${Math.round(left)}px`;
        button.style.top = `${Math.round(top)}px`;
        button.style.right = "auto";
        button.style.bottom = "auto";
        button.classList.toggle("darkscreen-launcher--hotbar", mode === "hotbar");
        button.classList.toggle("darkscreen-launcher--custom", mode === "custom");
    }

    static readUiButtonPosition() {
        try {
            const raw = localStorage.getItem("darksheet.darkscreenLauncherPosition");
            if (!raw) return null;
            const data = JSON.parse(raw);
            const left = Number(data?.left);
            const top = Number(data?.top);
            if (!Number.isFinite(left) || !Number.isFinite(top)) return null;
            return { left, top };
        } catch (error) {
            return null;
        }
    }

    static writeUiButtonPosition(left, top) {
        try {
            localStorage.setItem("darksheet.darkscreenLauncherPosition", JSON.stringify({
                left: Math.round(left),
                top: Math.round(top)
            }));
        } catch (error) {}
    }


    static normalizeOptions(options = {}) {
        const mode = options?.mode === "crafting" ? "crafting" : "full";
        return {
            mode,
            page: options?.page || (mode === "crafting" ? "gemcutting" : ""),
            actorId: String(options?.actorId || "")
        };
    }

    static initializeDarkscreen(options = {}) {
        if (!Darkscreen.dsc) Darkscreen.dsc = new DSC();
        Darkscreen.dsc.openDialog(Darkscreen.normalizeOptions(options));

    }
}

const DARKSHEET_AFFLICTION_PACK = "darksheet.afflictions";
const DARKSHEET_ROLLTABLE_PACK = "darksheet.darkrolltables";
const DARKSHEET_IRRATIONAL_AFFLICTION_ID = "Irratn4lQx9Vm2Zp";
const DARKSHEET_TABLE_RESULT_DOCUMENT_TYPE = "document";
const DARKSHEET_AFFLICTION_TABLE_NAMES = [
    "Fearful", "Lethargic", "Masochistic", "Irrational", "Paranoid", "Selfish",
    "Panic", "Hopelessness", "Mania", "Anxiety", "Hypochondria", "Narcissistic", "Powerful",
    "Focused", "Stalwart", "Acute", "Perceptive", "Courageous"
];

function darksheetHasCurrentDocumentResultType(result) {
    return result?.type === DARKSHEET_TABLE_RESULT_DOCUMENT_TYPE;
}

const DARKSHEET_DISCOVERIES = [
    "An old and ruined tower", "A burned out home", "A howling cavern",
    "A small, tightly locked chest", "A statue of a good deity", "A statue of an evil deity",
    "A circle of stone pillars", "A giant tree with far-reaching roots",
    "A ruined temple to an unknown god", "A cracked, stone fountain filled with a green ooze",
    "A strange pillar carved with bloody runes", "A strange, twisted tree",
    "An abandoned wagon and the signs of battle", "A small, unlocked hut with a warm hearth",
    "A locked door in the side of a hill", "A chilling cemetery",
    "An abandoned ruin of a castle", "A wrecked, half-buried pirate ship",
    "A strange plant with an alluring scent", "A tiny door in the foot of a tree",
    "A beautiful glade with delicious-looking fruit", "A twisted pillar with an evil, carved face",
    "A book on a bloody altar", "A monument to an ancient battle",
    "A boarded-up house with ghostly wails", "A pool of sweet, red water",
    "A collection of life-like humanoid stone statues", "A sleeping dragon",
    "A half-buried chest surrounded by skeletons"
];


async function darksheetEnsureDiscoveriesTable() {
    try {
        const pack = game.packs?.get?.(DARKSHEET_ROLLTABLE_PACK);
        if (!pack) return;
        const index = await pack.getIndex();
        if (index.find(entry => entry.name === "Discoveries")) return;
        const textType = CONST?.TABLE_RESULT_TYPES?.TEXT ?? "text";
        const results = DARKSHEET_DISCOVERIES.map((text, i) => ({
            type: textType,
            text,
            range: [i + 1, i + 1],
            weight: 1
        }));
        await darksheetWithUnlockedPack(pack, async () => {
            await RollTable.create({
                name: "Discoveries",
                description: "Darker Dungeons travel discoveries (Making a Journey, ch. 25).",
                formula: `1d${DARKSHEET_DISCOVERIES.length}`,
                replacement: true,
                displayRoll: true,
                results
            }, { pack: pack.collection });
        });
        console.log("Darksheet | Seeded Discoveries roll table into the compendium.");
    } catch (error) {
        console.warn("Darksheet | Could not seed Discoveries table.", error);
    }
}

async function darksheetWithUnlockedPack(pack, operation) {
    const wasLocked = !!pack?.locked;
    try {
        if (wasLocked && typeof pack.configure === "function") await pack.configure({ locked: false });
        return await operation();
    } finally {
        if (wasLocked && typeof pack?.configure === "function") {
            try { await pack.configure({ locked: true }); } catch (_) { /* leave pack usable if re-lock fails */ }
        }
    }
}

function darksheetTableResultSource(result) {
    try {
        return result?._source ?? (typeof result?.toObject === "function" ? result.toObject() : result) ?? {};
    } catch (_error) {
        return result?._source ?? {};
    }
}

function darksheetAfflictionNameFromResult(result) {
    const source = darksheetTableResultSource(result);
    const text = String(result?.name ?? source.name ?? result?.description ?? source.description ?? source.text ?? "");
    const bold = text.match(/<b>(.*?)<\/b>/)?.[1];
    if (bold) return bold.trim();
    return text.replace(/^Affliction:\s*/i, "").replace(/<[^>]+>/g, "").trim().split(/\s+/)[0] || "";
}

async function darksheetEnsureIrrationalAfflictionItem(pack, byName) {
    if (byName.Irrational) return byName.Irrational;
    const template = byName.Selfish || byName.Panic || byName.Acute || null;
    const source = template
        ? cloneDarkscreenData(typeof template.toObject === "function" ? template.toObject() : template._source)
        : {
            type: "feat",
            img: "icons/skills/wounds/anatomy-organ-brain-pink-red.webp",
            system: { description: { value: "", chat: "", unidentified: "" } },
            flags: { darksheet: { item: { slots: null, notches: null, quality: "pristine", fragility: "", temper: "", ammodie: "" } } }
        };
    source._id = DARKSHEET_IRRATIONAL_AFFLICTION_ID;
    source.name = "Affliction: Irrational";
    source.type ||= "feat";
    source.img ||= "icons/skills/wounds/anatomy-organ-brain-pink-red.webp";
    source.system ??= {};
    source.system.description ??= {};
    source.system.description.value = "<p>Disadvantage on INT checks &amp; saves</p>";
    source.flags ??= {};
    source.flags.core ??= {};
    source.flags.core.sourceId = `Compendium.${DARKSHEET_AFFLICTION_PACK}.${DARKSHEET_IRRATIONAL_AFFLICTION_ID}`;
    return Item.create(source, { pack: pack.collection || DARKSHEET_AFFLICTION_PACK });
}

async function darksheetEnsureAfflictionCompendiumLinks() {
    if (!game.user?.isGM) return;
    const afflictionPack = game.packs?.get?.(DARKSHEET_AFFLICTION_PACK);
    const tablePack = game.packs?.get?.(DARKSHEET_ROLLTABLE_PACK);
    if (!afflictionPack || !tablePack) return;

    try {
        await darksheetWithUnlockedPack(afflictionPack, async () => {
            const index = await afflictionPack.getIndex();
            const byName = {};
            for (const entry of index) {
                const plain = String(entry.name || "").replace(/^Affliction:\s*/i, "");
                if (plain) byName[plain] = await afflictionPack.getDocument(entry._id);
            }
            byName.Irrational = await darksheetEnsureIrrationalAfflictionItem(afflictionPack, byName);

            await darksheetWithUnlockedPack(tablePack, async () => {
                const tableIndex = await tablePack.getIndex();
                const tableEntry = Array.from(tableIndex).find(entry => entry.name === "Afflictions");
                if (!tableEntry) return;
                const table = await tablePack.getDocument(tableEntry._id);
                const results = Array.from(table?.results?.contents ?? table?.results ?? []);
                const updates = [];
                const resultNames = new Set(results.map(darksheetAfflictionNameFromResult));
                for (const result of results) {
                    const name = darksheetAfflictionNameFromResult(result);
                    if (!DARKSHEET_AFFLICTION_TABLE_NAMES.includes(name)) continue;
                    const item = byName[name];
                    if (!item) continue;
                    const source = darksheetTableResultSource(result);
                    const currentUuid = source.documentUuid ?? result?.uuid ?? "";
                    if (darksheetHasCurrentDocumentResultType(result) && currentUuid === item.uuid) continue;
                    updates.push({
                        _id: result.id,
                        type: DARKSHEET_TABLE_RESULT_DOCUMENT_TYPE,
                        name: `Affliction: ${name}`,
                        description: `Affliction: ${name}`,
                        img: item.img || "icons/skills/wounds/anatomy-organ-brain-pink-red.webp",
                        documentUuid: item.uuid
                    });
                }
                if (updates.length) await table.updateEmbeddedDocuments("TableResult", updates);
                if (!resultNames.has("Powerful") && byName.Powerful) {
                    await table.createEmbeddedDocuments("TableResult", [{
                        type: DARKSHEET_TABLE_RESULT_DOCUMENT_TYPE,
                        name: "Affliction: Powerful",
                        description: "Affliction: Powerful",
                        img: byName.Powerful.img || "icons/skills/wounds/anatomy-organ-brain-pink-red.webp",
                        weight: 1,
                        range: [73, 77],
                        drawn: false,
                        documentUuid: byName.Powerful.uuid
                    }]);
                }
            });
        });
    } catch (error) {
        console.warn("Darksheet | Could not repair Afflictions compendium links.", error);
    }
}

async function ensureDarkscreenFlags() {
    const screenData = getDarkscreenStore();
    if (!screenData.lastpage) screenData.lastpage = "party";
    await writeDarkscreenStore(screenData);
    return screenData;
}

function getDarkscreenFlags() {
    return getDarkscreenStore();
}

async function setDarkscreenFlags(screenData) {
    await writeDarkscreenStore(screenData);
}

function cloneDarkscreenData(data) {
    if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(data);
    if (data == null) return data;
    return JSON.parse(JSON.stringify(data));
}

function mergeDarkscreenData(base, patch) {
    const merge = globalThis.foundry?.utils?.mergeObject ?? globalThis.mergeObject;
    if (merge) return merge(cloneDarkscreenData(base), cloneDarkscreenData(patch ?? {}), {
        inplace: false,
        overwrite: true,
        insertKeys: true,
        insertValues: true
    });
    return { ...cloneDarkscreenData(base), ...cloneDarkscreenData(patch ?? {}) };
}

function readDarkscreenSettingStore() {
    try {
        return cloneDarkscreenData(game.settings.get('darksheet', 'darkscreenStore') ?? {});
    } catch (_) {
        return {};
    }
}
Darkscreen._uiButtonPositioningBound = false;
Darkscreen._uiButtonPositionFrame = null;
Darkscreen._uiButtonDrag = null;

function readLegacyDarkscreenFlags() {
    try {
        if (typeof game.world?.getFlag === "function") return cloneDarkscreenData(game.world.getFlag('darksheet', 'darkscreen') ?? {});
        return cloneDarkscreenData(game.world?.flags?.darksheet?.darkscreen ?? {});
    } catch (_) {
        return {};
    }
}

function readLegacyDarkscreenJourneyStore() {
    try {
        return cloneDarkscreenData(game.settings.get('darksheet', 'darkscreenJourneyStore') ?? {});
    } catch (_) {
        return {};
    }
}

function hasDarkscreenPayload(data) {
    if (!data || typeof data !== "object") return false;
    return Object.keys(data).some(key => key !== "version");
}

const DARKSCREEN_GM_DEFAULT_COLUMNS = 2;
const DARKSCREEN_GM_DEFAULT_ROWS = 3;
const DARKSCREEN_GM_MIN_GRID_SIZE = 1;
const DARKSCREEN_GM_MAX_GRID_SIZE = 6;
const DARKSCREEN_GM_DEFAULT_SLOT_COUNT = DARKSCREEN_GM_DEFAULT_COLUMNS * DARKSCREEN_GM_DEFAULT_ROWS;

function normalizeDarkscreenGmDimension(value, fallback) {
    const numeric = Math.round(Number(value));
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(DARKSCREEN_GM_MAX_GRID_SIZE, Math.max(DARKSCREEN_GM_MIN_GRID_SIZE, numeric));
}

function darkscreenGmDimensions(source = {}) {
    const raw = source && typeof source === "object" ? source : {};
    const layout = raw.layout && typeof raw.layout === "object" ? raw.layout : {};
    return {
        columns: normalizeDarkscreenGmDimension(raw.columns ?? raw.cols ?? layout.columns, DARKSCREEN_GM_DEFAULT_COLUMNS),
        rows: normalizeDarkscreenGmDimension(raw.rows ?? layout.rows, DARKSCREEN_GM_DEFAULT_ROWS)
    };
}

function darkscreenGmSlotCount(source = {}) {
    const dimensions = darkscreenGmDimensions(source);
    return dimensions.columns * dimensions.rows;
}

function normalizeDarkscreenGmStoredEntry(entry = {}, index = 0) {
    const source = entry && typeof entry === "object" ? entry : {};
    const hasStoredSource = source.source && typeof source.source === "object" && !Array.isArray(source.source);
    const normalized = {
        id: source.id || source._id || `entry-${index + 1}`,
        uuid: hasStoredSource ? "" : (source.uuid || ""),
        type: source.type || source.documentName || "",
        name: source.name || "Stored Entry",
        img: source.img || source.texture?.src || ""
    };
    if (source.actorType) normalized.actorType = source.actorType;
    if (source.itemType) normalized.itemType = source.itemType;
    if (hasStoredSource) {
        normalized.source = cloneDarkscreenData(source.source);
    }
    return normalized;
}

function normalizeDarkscreenGmSlot(slot = {}, index = 0) {
    const source = slot && typeof slot === "object" ? slot : {};
    const normalized = {
        id: source.id || `slot-${index + 1}`,
        uuid: source.uuid || "",
        type: source.type || "",
        name: source.name || "",
        img: source.img || "",
        assignedAt: source.assignedAt || null
    };
    if (source.collection) normalized.collection = source.collection;
    if (source.documentName) normalized.documentName = source.documentName;
    if (source.packageName) normalized.packageName = source.packageName;
    if (source.packType) normalized.packType = source.packType;
    if (Array.isArray(source.entries)) normalized.entries = source.entries.map(normalizeDarkscreenGmStoredEntry);
    if (source.source && typeof source.source === "object" && !Array.isArray(source.source)) normalized.source = cloneDarkscreenData(source.source);
    return normalized;
}

function normalizeDarkscreenGmSlots(slots = [], count = DARKSCREEN_GM_DEFAULT_SLOT_COUNT, preserveExisting = false) {
    const sourceSlots = Array.isArray(slots) ? slots : [];
    const targetCount = Math.max(DARKSCREEN_GM_MIN_GRID_SIZE, Number(count) || DARKSCREEN_GM_DEFAULT_SLOT_COUNT);
    const length = preserveExisting ? Math.max(targetCount, sourceSlots.length) : targetCount;
    return Array.from({ length }, (_, index) => normalizeDarkscreenGmSlot(sourceSlots[index], index));
}

function gmSlotsHavePayload(slots = []) {
    return Array.isArray(slots) && slots.some(slot => slot && typeof slot === "object" && (slot.uuid || slot.name || slot.type || slot.img || slot.collection || slot.entries?.length));
}

function normalizeDarkscreenGmPreset(preset = {}, fallbackId = "default", fallbackName = "GM Screen") {
    const source = preset && typeof preset === "object" && !Array.isArray(preset) ? preset : {};
    const dimensions = darkscreenGmDimensions(source);
    return {
        id: String(source.id || fallbackId || "default"),
        name: String(source.name || fallbackName || "GM Screen").trim() || "GM Screen",
        columns: dimensions.columns,
        rows: dimensions.rows,
        slots: normalizeDarkscreenGmSlots(source.slots, dimensions.columns * dimensions.rows, true)
    };
}

function normalizeDarkscreenGmScreen(gmScreen = {}) {
    const raw = gmScreen && typeof gmScreen === "object" && !Array.isArray(gmScreen) ? gmScreen : {};
    const legacySlots = Array.isArray(raw.slots) ? raw.slots : [];
    const rawPresets = raw.presets && typeof raw.presets === "object" && !Array.isArray(raw.presets) ? raw.presets : {};
    const rawPresetEntries = Object.entries(rawPresets).filter(([, preset]) => preset && typeof preset === "object" && !Array.isArray(preset));
    const presetsHavePayload = rawPresetEntries.some(([id, preset]) =>
        id !== "default" || preset.name !== "Default" || gmSlotsHavePayload(preset.slots)
    );

    const presets = {};
    let order = [];

    if (gmSlotsHavePayload(legacySlots) && !presetsHavePayload) {
        presets.default = {
            ...normalizeDarkscreenGmPreset(raw, "default", raw.name || "Default"),
            id: "default",
            name: String(raw.name || "Default").trim() || "Default",
            slots: normalizeDarkscreenGmSlots(legacySlots, darkscreenGmSlotCount(raw), true)
        };
        order = ["default"];
    } else {
        let fallbackIndex = 1;
        for (const [key, preset] of rawPresetEntries) {
            let id = String(preset.id || key || `preset-${fallbackIndex++}`).trim();
            if (!id) id = `preset-${fallbackIndex++}`;
            while (presets[id]) id = `preset-${fallbackIndex++}`;
            presets[id] = normalizeDarkscreenGmPreset({ ...preset, id }, id, id === "default" ? "Default" : "GM Screen");
            order.push(id);
        }
    }

    if (!order.length) {
        presets.default = normalizeDarkscreenGmPreset({ id: "default", name: "Default", slots: [] }, "default", "Default");
        order = ["default"];
    }

    const ordered = Array.isArray(raw.order)
        ? raw.order.map(id => String(id)).filter(id => presets[id])
        : [];
    order = Array.from(new Set([...ordered, ...order]));

    let activePresetId = String(raw.activePresetId || raw.activeId || order[0]);
    if (!presets[activePresetId]) activePresetId = order[0];

    return {
        activePresetId,
        order,
        presets,
        slots: presets[activePresetId]?.slots ?? normalizeDarkscreenGmSlots([])
    };
}

function normalizeDarkscreenStore(data = {}) {
    const normalized = mergeDarkscreenData(DARKSCREEN_STORE_DEFAULTS, data);
    normalized.version = Number(normalized.version || DARKSCREEN_STORE_DEFAULTS.version);
    normalized.lastpage ||= "party";
    if (!normalized.journey || typeof normalized.journey !== "object") normalized.journey = { list: {}, activeId: null };
    normalized.journey.list ??= {};
    normalized.journey.activeId ??= null;
    if (!Object.keys(normalized.journey.list).length && (normalized.journey.destination || normalized.journey.days?.length || normalized.journey.distance || normalized.journey.pace)) {
        const id = "legacy";
        normalized.journey = {
            list: {
                [id]: {
                    ...normalized.journey,
                    id,
                    name: normalized.journey.destination || "Journey"
                }
            },
            activeId: id
        };
    }
    if (!normalized.disposition || typeof normalized.disposition !== "object") normalized.disposition = { list: [] };
    normalized.disposition.list = Array.isArray(normalized.disposition.list) ? normalized.disposition.list : [];
    if (!normalized.dread || typeof normalized.dread !== "object") normalized.dread = { list: {}, activeId: null };
    normalized.dread.list ??= {};
    if (!Object.keys(normalized.dread.list).length && (normalized.dread.force != null || normalized.dread.zone != null || normalized.dread.current != null || normalized.dread.max != null || normalized.dread.custom)) {
        const id = "legacy";
        normalized.dread = {
            list: {
                [id]: {
                    id,
                    name: normalized.dread.force || "Dread Zone",
                    force: normalized.dread.force ?? "",
                    zone: normalized.dread.zone ?? "",
                    current: Number(normalized.dread.current ?? 0),
                    max: Number(normalized.dread.max ?? 20),
                    custom: Array.isArray(normalized.dread.custom) ? normalized.dread.custom : []
                }
            },
            activeId: id,
            displayId: null
        };
    }
    normalized.dread.activeId ??= null;
    normalized.dread.displayId = normalized.dread.displayId && normalized.dread.list?.[normalized.dread.displayId]
        ? normalized.dread.displayId
        : null;
    if (!normalized.diseases || typeof normalized.diseases !== "object") normalized.diseases = { list: [], custom: {}, dismissedReminder: "" };
    normalized.diseases.list = Array.isArray(normalized.diseases.list) ? normalized.diseases.list : [];
    normalized.diseases.custom = normalized.diseases.custom && typeof normalized.diseases.custom === "object" && !Array.isArray(normalized.diseases.custom)
        ? normalized.diseases.custom
        : {};
    normalized.diseases.dismissedReminder ??= "";
    normalized.itemTempering = { ...(normalized.itemTempering ?? {}) };
    normalized.gmScreen = normalizeDarkscreenGmScreen(normalized.gmScreen);
    normalized.grimoire = { ...DARKSCREEN_STORE_DEFAULTS.grimoire, ...(normalized.grimoire ?? {}) };
    normalized.grimoire.url ||= DARKSCREEN_STORE_DEFAULTS.grimoire.url;
    normalized.grimoire.bookmarks = Array.isArray(normalized.grimoire.bookmarks) ? normalized.grimoire.bookmarks : [];
    normalized.resting = { ...DARKSCREEN_STORE_DEFAULTS.resting, ...(normalized.resting ?? {}) };
    normalized.campfire = { active: false, ...(normalized.campfire ?? {}) };
    normalized.cityRest = { active: false, ...(normalized.cityRest ?? {}) };
    normalized.campSetup = { active: false, players: {}, ...(normalized.campSetup ?? {}) };
    return normalized;
}

function getDarkscreenStore() {
    const settingStore = readDarkscreenSettingStore();
    const legacyFlags = readLegacyDarkscreenFlags();
    const base = hasDarkscreenPayload(settingStore) ? settingStore : legacyFlags;
    const store = normalizeDarkscreenStore(base);
    const legacyJourney = readLegacyDarkscreenJourneyStore();
    const journeyHasPayload = store.journey?.activeId || Object.keys(store.journey?.list ?? {}).length || store.journey?.destination || store.journey?.days?.length;
    if (!journeyHasPayload && hasDarkscreenPayload(legacyJourney)) store.journey = cloneDarkscreenData(legacyJourney);
    return normalizeDarkscreenStore(store);
}

async function writeDarkscreenStore(screenData) {
    if (!game.user?.isGM) return; // only the GM persists; players relay via campStateWrite
    const normalized = normalizeDarkscreenStore(screenData);
    try {
        await game.settings.set('darksheet', 'darkscreenStore', cloneDarkscreenData(normalized));
    } catch (error) {
        console.warn("Darksheet | Could not write canonical Darkscreen store.", error);
    }
    try {
        await game.settings.set('darksheet', 'darkscreenJourneyStore', cloneDarkscreenData(normalized.journey ?? { list: {}, activeId: null }));
    } catch (_) {
        // Older installs may not have the compatibility setting registered yet.
    }
    await mirrorDarkscreenFlags(normalized);
    return normalized;
}

async function mirrorDarkscreenFlags(screenData) {
    if (typeof game.world?.setFlag === "function") {
        await game.world.setFlag('darksheet', 'darkscreen', screenData);
        return;
    }
    if (typeof game.world?.update === "function") {
        await game.world.update({ 'flags.darksheet.darkscreen': screenData });
        return;
    }

    game.world.flags ??= {};
    game.world.flags.darksheet ??= {};
    game.world.flags.darksheet.darkscreen = screenData;
}

// Intentionally no auto-reload on actor updates. Re-rendering the darkscreen
// on every actor field change wipes the active page and any in-flight UI state
// (journey form values, scroll position, etc.). Reloads are now triggered
// explicitly via Darksheet.darkScreenReload() by the code paths that need them.

const DarksheetApplicationV2 = foundry.applications.api.ApplicationV2;
const DarksheetHandlebarsApplicationMixin = foundry.applications.api.HandlebarsApplicationMixin;

class DSC extends DarksheetHandlebarsApplicationMixin(DarksheetApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "darksheet-darkscreen",
        classes: ["DSC-window", "resizable"],
        window: {
            title: "Darker Dungeons - Gamemaster Screen 2.0",
            icon: "fa-solid fa-book-skull",
            minimizable: true,
            resizable: true
        },
        position: {
            width: 1200,
            height: 1200
        }
    };

    static PARTS = {
        screen: {
            template: "modules/darksheet/templates/darkscreen.html",
            root: true,
            scrollable: [".DarkScreenContent"]
        }
    };

    _darkscreenOptions = Darkscreen.normalizeOptions();

    get title() {
        return this._darkscreenOptions?.mode === "crafting"
            ? "Darker Dungeons - Crafting"
            : "Darker Dungeons - Gamemaster Screen";
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const darkscreenOptions = Darkscreen.normalizeOptions(this._darkscreenOptions);
        const craftingOnly = darkscreenOptions.mode === "crafting";
        const screenData = game.user?.isGM ? await ensureDarkscreenFlags() : getDarkscreenStore();
        return {
            ...context,
            title: craftingOnly ? "Darker Dungeons - Crafting" : "Darker Dungeons - Gamemaster Screen",
            data: {
                ...(context.data ?? {}),
                screenData,
                mode: darkscreenOptions.mode,
                craftingOnly,
                isGM: !!game.user?.isGM,
                actorId: darkscreenOptions.actorId,
                initialPage: darkscreenOptions.page || (craftingOnly ? "gemcutting" : screenData.lastpage)
            }
        };
    }

    async openDialog(options = {}) {
        this._darkscreenOptions = Darkscreen.normalizeOptions(options);
        const focusedMode = this._darkscreenOptions.mode === "crafting";
        if (Darksheet._darkscreen?.rendered) {
            if (focusedMode) {
                Darksheet._darkscreen._darkscreenOptions = this._darkscreenOptions;
                await Darksheet._darkscreen.render({ force: true, parts: ["screen"] });
                return;
            }
            await Darksheet._darkscreen.close();
            Darksheet._darkscreen = null;
            return;
        }

        const existingApplication = Array.from(foundry.applications.instances?.values?.() ?? []).find(app => {
            return app !== this && app?.element?.classList?.contains("DSC-window");
        });
        if (existingApplication?.rendered) {
            if (focusedMode) {
                existingApplication._darkscreenOptions = this._darkscreenOptions;
                Darksheet._darkscreen = existingApplication;
                await existingApplication.render({ force: true, parts: ["screen"] });
                return;
            }
            await existingApplication.close();
            if (Darksheet._darkscreen === existingApplication) Darksheet._darkscreen = null;
            return;
        }

        Darksheet._darkscreen = this;
        await this.render({ force: true });
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        Darksheet._darkscreen = this;
        this.element?.classList?.toggle("is-crafting-only", this._darkscreenOptions?.mode === "crafting");
        this._activateInlineScripts();
    }

    _onClose(options) {
        super._onClose(options);
        if (Darksheet._darkscreen === this) Darksheet._darkscreen = null;
    }

    _activateInlineScripts() {
        for (const script of this.element?.querySelectorAll("script") ?? []) {
            const activeScript = document.createElement("script");
            for (const attr of script.attributes) activeScript.setAttribute(attr.name, attr.value);
            activeScript.textContent = script.textContent;
            script.replaceWith(activeScript);
        }
    }
}
Hooks.once('ready', async function() {
    darksheetPatchEncumbrancePreparation();
    darksheetRegisterEncumbranceStatusEffects();
    darksheetSyncAllEncumbranceConditions();
    window.setTimeout(() => {
        darksheetRegisterEncumbranceStatusEffects();
        darksheetSyncAllEncumbranceConditions();
    }, 1000);
    window.setTimeout(() => darksheetSyncAllEncumbranceConditions(), 3000);
    if (game.user.isGM) {
        await darksheetEnsureAfflictionCompendiumLinks();
        await darksheetEnsureDiscoveriesTable();
        await ensureDarkscreenFlags();
        Darkscreen.addUiButton();
        window.setTimeout(() => Darksheet.checkDiseaseReminders(), 1000);
    }
});
Hooks.on("updateWorldTime", () => Darksheet.checkDiseaseReminders());
Hooks.on("dnd5e.postBuildAbilityCheckRollConfig", darksheetApplyEncumbranceRollDisadvantage);
Hooks.on("dnd5e.postBuildSavingThrowRollConfig", darksheetApplyEncumbranceRollDisadvantage);
Hooks.on("dnd5e.postBuildSkillRollConfig", darksheetApplyEncumbranceRollDisadvantage);
Hooks.on("dnd5e.postBuildAttackRollConfig", darksheetApplyEncumbranceRollDisadvantage);
Hooks.on("updateSetting", setting => {
    if (["darksheet.slotbasedinventory", "darksheet.equippedDontUseSlots", "darksheet.slotCapacityFormula", "dnd5e.encumbrance"].includes(setting?.key)) darksheetSyncAllEncumbranceConditions();
});
Hooks.on('canvasReady', function() {
    if (game.user.isGM) Darkscreen.addUiButton();
});

const itemBulk = {
    'Abacus': 1,
    'Acid (vial)': 0.2,
    'Alchemist\u2019s Fire (flask)': 1,
    'Arrow': 0.1,
    'Crossbow Bolt': 0.1,
    'Bullet': 0.1,
    'Needle': 0.1,
    'Antitoxin (vial)': 0.2,
    'Crystal': 1,
    'Orb': 1,
    'Rod': 1,
    'Staff': 3,
    'Ball Bearings': 1,
    'Barrel': 9,
    'Bedroll': 2,
    'Bell': 1,
    'Blanket': 1,
    'Block & Tackle': 1,
    'Book': 1,
    'Bottle, Glass': 1,
    'Bucket': 2,
    'Caltrops (20)': 1,
    'Candle': 0.2,
    'Case': 1,
    'Chain (10 ft)': 1,
    'Chalk (1 piece)': 0.2,
    'Chest': 6,
    'Common Clothes': 1,
    'Costume': 2,
    'Fine Clothes': 2,
    'Traveler\u2019s Clothes': 1,
    'Component Pouch': 1,
    'Crowbar': 2,
    'Mistletoe': 1,
    'Staff': 3,
    'Totem': 1,
    'Wand': 1,
    'Fishing Tackle': 1,
    'Flask or Tankard': 1,
    'Cards': 1,
    'Dice': 1,
    'Dragonchess': 1,
    '3 Dragon Ante': 1,
    'Grappling Hook': 1,
    'Hammer': 1,
    'Hammer, Sledge': 3,
    'Amulet': 1,
    'Emblem': 1,
    'Reliquary': 1,
    'Hourglass': 1,
    'Hunting Trap': 1,
    'Ink': 0.2,
    'Ink Pen': 0.2,
    'Bagpipes': 3,
    'Drum': 2,
    'Dulcimer': 3,
    'Flute': 1,
    'Horn': 2,
    'Lute': 2,
    'Lyre': 2,
    'Pan Flute': 1,
    'Shawm': 2,
    'Viol': 2,
    'Jug or Pitcher': 1,
    'Climbers': 1,
    'Disguise': 1,
    'Forgery': 1,
    'Healer\u2019s': 1,
    'Herbalism': 1,
    'Mess': 1,
    'Poisoner\u2019s': 1,
    'Ladder (10 ft)': 3,
    'Lamp': 1,
    'Bullseye': 1,
    'Hooded': 1,
    'Lock': 1,
    'Magnifying Glass': 1,
    'Manacles': 1,
    'Mirror, Steel': 1,
    'Flask': 1,
    'Paper (1 sheet)': 0.2,
    'Parchment (1 sheet)': 0.2,
    'Perfume (vial)': 0.2,
    'Miner\u2019s': 3,
    'Piton': 0.2,
    'Vial': 0.2,
    'Pole (10 ft)': 3,
    'Pot, Iron': 1,
    'Potion': 1,
    'Ram, Portable': 6,
    'Ration (1)': 0.2,
    'Ration Box': 1,
    'Rope, Hempen (50 ft)': 2,
    'Rope, Silk (50 ft)': 1,
    'Scale, Merchant\u2019s': 1,
    'Sealing Wax': 0.2,
    'Shovel': 3,
    'Signal Whistle': 0.2,
    'Signet Ring': 0.2,
    'Soap': 0.2,
    'Spellbook': 1,
    'Spikes, Iron (10)': 1,
    'Spyglass': 1,
    'Tent, Two-person': 3,
    'Tinderbox': 1,
    'Supplies': 2,
    'Brewer': 2,
    'Calligrapher': 1,
    'Carpenter': 1,
    'Cartographer': 1,
    'Cobbler': 1,
    'Cook': 2,
    'Glassblower': 2,
    'Jeweler': 1,
    'Leatherworker': 2,
    'Mason': 2,
    'Navigator': 1,
    'Painter': 2,
    'Potter': 2,
    'Smith': 2,
    'Thieves': 1,
    'Tinker': 1,
    'Weaver': 2,
    'Woodcarver': 1,
    'Torch': 1,
    'Vial': 0.2,
    'Waterskin': 1,
    'Whetstone': 1,
    'Padded': 3,
    'Leather': 3,
    'Studded Leather': 3,
    'Hide': 6,
    'Chain Shirt': 6,
    'Scale Mail': 6,
    'Breastplate': 6,
    'Half Plate': 6,
    'Ring Mail': 9,
    'Chain Mail': 9,
    'Splint Mail': 9,
    'Plate Mail': 9,
    'Shield': 2,
    'Battleaxe': 3,
    'Blowgun': 1,
    'Club': 2,
    'Hand Crossbow': 1,
    'Light Crossbow': 2,
    'Heavy Crossbow': 3,
    'Dagger': 1,
    'Dart': 0.2,
    'Flail': 2,
    'Glaive': 3,
    'Greataxe': 3,
    'Greatclub': 3,
    'Greatsword': 3,
    'Halberd': 3,
    'Handaxe': 2,
    'Javelin': 3,
    'Lance': 3,
    'Light Hammer': 1,
    'Longbow': 3,
    'Longsword': 3,
    'Mace': 2,
    'Maul': 3,
    'Morningstar': 2,
    'Net': 1,
    'Pike': 3,
    'Quarterstaff': 3,
    'Rapier': 2,
    'Scimitar': 2,
    'Shortbow': 2,
    'Shortsword': 2,
    'Sickle': 1,
    'Sling': 1,
    'Spear': 3,
    'Trident': 3,
    'War Pick': 2,
    'Warhammer': 3,
    'Whip': 1,
    "Burglar's Pack": "17",
    "Diplomat's Pack": "9",
    "Dungeoneer's Pack": "22",
    "Entertainer's Pack": "11",
    "Explorer's Pack": "20",
    "Priest's Pack": "11",
    "Scholar's Pack": "5",
    "Potion": "0.2",
    "Oil": "0.2",
    "Poison": "0.2",
    "Philter": "0.2"
}

function isItemFragile(itemName, source = darksheetFragileItemsTable()) {
    return source.some(fragileItem => itemName.includes(fragileItem));
}
const fragileItems = [
    "Crystal",
    "Orb",
    "Potion",
    "Spyglass",
    "Vial",
    "Glass",
    "Ceramic",
    "Vial",
    "Flask",
    "Scroll",
    "Jug",
    "Pitcher",
    "Waterskin",
    "Oil",
    "Philter",
    "Antitoxin",
    "Alchemist's Fire",
    "Poison",
    "Pen",
    "Parchment",
    "Paper",
    "Torch"
];

/* =====
 CAMPFIRE - shared resting dialog
 ===== */
const CAMP_SETUP_ROLES = {
    survival:       { label: "Survival",        icon: "fa-campground",       skill: "sur", note: "Find the site, pitch tents, start the fire, and secure the camp." },
    athletics:      { label: "Athletics",       icon: "fa-dumbbell",         skill: "ath", note: "Move heavy gear, clear ground, or haul shelter into place." },
    animalHandling: { label: "Animal Handling", icon: "fa-horse",            skill: "ani", note: "Check for animal signs and secure mounts or pack beasts." },
    nature:         { label: "Nature",          icon: "fa-leaf",             skill: "nat", note: "Find good wood, shelter, water flow, and natural protection." },
    religion:       { label: "Religion",        icon: "fa-place-of-worship", skill: "rel", note: "Bless, ward, or sanctify the campsite." }
};

const CAMP_ACTIVITIES = {
    keepWatch:  { label: "Keep Watch",      icon: "fa-eye",                skill: "prc", effect: "watch",        note: "Lookout duty. Spot threats before they reach camp." },
    cook:       { label: "Cook",            icon: "fa-fire-burner",        skill: "sur", effect: "hitdie",       note: "Hot meal. Regain 1 spent hit die on success." },
    forage:     { label: "Forage",          icon: "fa-seedling",           skill: "sur", effect: "rations",      note: "Gather 1d4+1 rations on success." },
    mend:       { label: "Mend",            icon: "fa-screwdriver-wrench", skill: "ste", effect: "mend",         note: "Pick an item and remove 1 notch on success." },
    tendWounds: { label: "Tend Wounds",     icon: "fa-staff-snake",        skill: "med", effect: "tendWound",    note: "Treat one untreated wound on success." },
    sleep:      { label: "Sleep",           icon: "fa-bed",                skill: null,  effect: "hitdie",       note: "Undisturbed sleep. Regain 1 spent hit die." },
    pray:       { label: "Pray / Meditate", icon: "fa-place-of-worship",   skill: "rel", effect: "stressSelf",   note: "Find peace. Reduce stress by 1d4 on success." },
    tellStories:{ label: "Tell Stories",    icon: "fa-masks-theater",      skill: "prf", effect: "stressParty",  note: "Lift morale. Party stress -1d4 on success." },
    drink:      { label: "Drink",           icon: "fa-wine-glass",         skill: null,  effect: "stressSelf",   note: "A stiff drink. Reduce stress by 1d4." },
    train:      { label: "Train",           icon: "fa-dumbbell",           skill: "ath", effect: "inspiration",  note: "Hone your craft. Gain Inspiration on success." },
    study:      { label: "Study",           icon: "fa-book",               skill: "his", effect: "inspiration",  note: "Pore over notes. Gain Inspiration on success." }
};

async function getCampfireState() {
    const data = await ensureDarkscreenFlags();
    return data.campfire ?? { active: false };
}
async function setCampfireState(campfire) {
    const data = await ensureDarkscreenFlags();
    data.campfire = { ...(data.campfire ?? {}), ...campfire };
    await setDarkscreenFlags(data);
    return data.campfire;
}
async function ensureCampfireState(patch = {}) {
    const data = await ensureDarkscreenFlags();
    data.campfire = { players: {}, ...(data.campfire ?? {}), ...patch };
    await setDarkscreenFlags(data);
    return data.campfire;
}

/* ----- City Long Rest state ----- */
async function getCityRestState() {
    const data = await ensureDarkscreenFlags();
    return data.cityRest ?? { active: false };
}
async function setCityRestState(cityRest) {
    const data = await ensureDarkscreenFlags();
    data.cityRest = { ...(data.cityRest ?? {}), ...cityRest };
    await setDarkscreenFlags(data);
    return data.cityRest;
}
async function ensureCityRestState(patch = {}) {
    const data = await ensureDarkscreenFlags();
    data.cityRest = { players: {}, lifestyle: "comfortable", ...(data.cityRest ?? {}), ...patch };
    await setDarkscreenFlags(data);
    return data.cityRest;
}

const LONG_REST_ACTIVITIES = {
    "work-coin":      { label: "Work for Coin",        icon: "fa-hammer",             roll: false, note: "Earn weekly wages per your lifestyle. No roll required, just time." },
    "work-renown":    { label: "Work for Renown",      icon: "fa-star",               roll: true,  skill: "prf",   note: "Perform a deed and build your reputation." },
    "spread-rumors":  { label: "Spread Rumors",        icon: "fa-comments",           roll: true,  skill: "dec",   note: "Plant whispers in the right ears." },
    "find-merchant":  { label: "Find a Rare Merchant", icon: "fa-magnifying-glass",   roll: true,  skill: "ins",   note: "Hunt down a discreet buyer or seller." },
    "sell-exotic":    { label: "Sell an Exotic Item",  icon: "fa-coins",              roll: true,  skill: "per",   note: "Persuade someone to buy a peculiar item." },
    "craft":          { label: "Craft an Item",        icon: "fa-screwdriver-wrench", roll: true,  ability: "int", note: "Craft an item with appropriate tools." },
    "learn-tool":     { label: "Learn a Tool",         icon: "fa-toolbox",            roll: false, note: "Spend the week training with a new tool. Investment of time, no roll." },
    "research":       { label: "Research",             icon: "fa-book-open-reader",   roll: true,  skill: "inv",   note: "Investigate a specific topic." },
    "training":       { label: "Training",             icon: "fa-dumbbell",           roll: false, note: "Train toward your next level (see Training Time & Costs). No roll." },
    "carouse":        { label: "Carouse & Socialize",  icon: "fa-wine-glass",         roll: true,  skill: "per",   note: "Mingle, gossip, and make connections." },
    "rnr":            { label: "Rest & Relaxation",    icon: "fa-couch",              roll: true,  autoHealStress: true, note: "Just rest. Auto-heals 2d6 stress." },
    "volunteer":      { label: "Volunteer Work",       icon: "fa-hand-holding-heart", roll: false, note: "Help a temple, guild, or the commoners. Narrative service, no roll." },
    "criminal":       { label: "Criminal Activity",    icon: "fa-mask",               roll: true,  skill: "ste",   note: "Heists, theft, intimidation, fencing." },
    "business":       { label: "Run a Business",       icon: "fa-store",              roll: false, note: "Manage your enterprise for the week. No roll." },
    "service":        { label: "Perform a Service",    icon: "fa-handshake",          roll: true,  skill: "prf",   note: "Render a hire-by-the-week service." },
    "language":       { label: "Learn a Language",     icon: "fa-language",           roll: false, note: "Pick up the basics of a new language. Investment of time, no roll." }
};

const LIFESTYLE_CONDITION_LABELS = {
    foodstuffed: "Stuffed", foodwellfed: "Well-fed", foodok: "Sated", foodpekish: "Peckish", foodhungry: "Hungry", foodravenous: "Ravenous", foodstarving: "Starving",
    wquenched: "Quenched", wrefreshed: "Refreshed", wok: "Hydrated", wparched: "Parched", wthirsty: "Thirsty", wdry: "Dry", wdehydrated: "Dehydrated",
    exenegised: "Energized", exwell: "Rested", exok: "Steady", extired: "Tired", exsleepy: "Sleepy", exvsleepy: "Very Sleepy", exbarely: "Barely Awake"
};

function formatLifestyleEffects(lifestyleKey) {
    const l = DARKSCREEN_LIFESTYLES[lifestyleKey];
    if (!l) return "";
    const food = LIFESTYLE_CONDITION_LABELS[l.food] || l.food;
    const water = LIFESTYLE_CONDITION_LABELS[l.water] || l.water;
    const fatigue = LIFESTYLE_CONDITION_LABELS[l.fatigue] || l.fatigue;
    return `${l.hp} HP \u00B7 ${l.hitDice} HD \u00B7 ${food} \u00B7 ${water} \u00B7 ${fatigue}`;
}

async function getCampSetupState() {
    const data = await ensureDarkscreenFlags();
    return data.campSetup ?? { active: false, players: {} };
}
async function setCampSetupState(campSetup) {
    const data = await ensureDarkscreenFlags();
    data.campSetup = { players: {}, ...(data.campSetup ?? {}), ...campSetup };
    await setDarkscreenFlags(data);
    return data.campSetup;
}
async function ensureCampSetupState(patch = {}) {
    const data = await ensureDarkscreenFlags();
    data.campSetup = { players: {}, ...(data.campSetup ?? {}), ...patch };
    await setDarkscreenFlags(data);
    return data.campSetup;
}

class DarksheetCampSetup {
    static _dialog = null;

    static visibleCharacters() {
        return game.actors.filter(actor => actor.type === "character");
    }

    static buildContent(state) {
        const characters = this.visibleCharacters();
        const isGM = game.user.isGM;
        const dc = Number(state.dc ?? 10);
        const activityDc = state.activityDc ? `Activity DC ${state.activityDc}` : "Activity DC pending";
        const slots = characters.map(actor => {
            const playerState = state.players?.[actor.id] ?? {};
            const isMine = isGM || actor.testUserPermission?.(game.user, "OWNER");
            const selectedRole = playerState.role ? CAMP_SETUP_ROLES[playerState.role] : null;
            const opts = Object.entries(CAMP_SETUP_ROLES)
                .map(([key, role]) => `<option value="${key}"${playerState.role === key ? " selected" : ""}>${role.label}</option>`)
                .join("");

            return `
                <div class="ds-camp-setup-card${playerState.rollResult != null ? " has-rolled" : ""}" data-actor-id="${actor.id}">
                    <img class="ds-camp-setup-portrait" src="${actor.img}" alt="${actor.name}">
                    <div class="ds-camp-setup-body">
                        <div class="ds-camp-setup-name">${actor.name}</div>
                        <select class="ds-camp-setup-role" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                            <option value="">\u2014 Pick setup role \u2014</option>
                            ${opts}
                        </select>
                        ${selectedRole ? `<div class="ds-camp-setup-note">${selectedRole.note}</div>` : ""}
                    </div>
                    <div class="ds-camp-setup-rolls">
                        <button type="button" class="ds-camp-setup-roll" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                            <i class="fa-solid fa-dice-d20"></i> Roll
                        </button>
                        <button type="button" class="ds-camp-setup-roll" data-actor-id="${actor.id}" data-disadvantage="true" title="No camping gear: roll with disadvantage" ${isMine ? "" : "disabled"}>
                            <i class="fa-solid fa-dice-d20"></i> Disadv.
                        </button>
                    </div>
                    <span class="ds-camp-setup-result">${playerState.rollResult != null ? `${playerState.rollResult}${playerState.disadvantage ? " dis." : ""} ${playerState.success ? "\u2713" : "\u2717"}` : "\u2014"}</span>
                </div>
            `;
        }).join("");

        return `
            <div class="ds-camp-setup">
                <header class="ds-camp-setup-header">
                    <div>
                        <strong>Make Camp</strong>
                        <span>Each character helps set up the campsite. At least one check should use Survival.</span>
                    </div>
                    <div class="ds-camp-setup-dc">
                        <span>Camping DC ${dc}</span>
                        <span>${activityDc}</span>
                    </div>
                </header>
                <div class="ds-camp-setup-list">${slots}</div>
                <footer class="ds-camp-setup-footer">
                    ${isGM ? `<button type="button" class="ds-action ds-action-danger" id="ds-camp-setup-close">Close Setup</button>` : ""}
                </footer>
            </div>
        `;
    }

    static async openLocal() {
        const state = await getCampSetupState();
        if (game.user.isGM && !state?.active) await ensureCampSetupState({ active: true, started: Date.now() });
        if (this._dialog?.rendered) {
            this.applyState(await getCampSetupState());
            return;
        }
        this._dialog = new Dialog({
            title: "Camp Setup",
            content: this.buildContent(await getCampSetupState()),
            buttons: {},
            close: () => { this._dialog = null; }
        }, { classes: ["dialog", "darksheet-dialog", "ds-camp-setup-dialog"], width: 760, height: 620, resizable: true });
        this._dialog.render(true);

        Hooks.once("renderDialog", (app, html) => {
            if (app !== this._dialog) return;
            this.wire(html[0]);
        });
    }

    static async applyState(state) {
        if (!this._dialog?.rendered) return;
        const html = this._dialog.element[0];
        const container = html.querySelector(".dialog-content");
        if (!container) return;
        container.innerHTML = this.buildContent(state);
        this.wire(container);
    }

    static wire(root) {
        root.querySelectorAll(".ds-camp-setup-role").forEach(select => {
            select.addEventListener("change", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.updateCampSetupPlayer(actorId, {
                    role: event.currentTarget.value || null,
                    rollResult: null,
                    rollFormula: null,
                    disadvantage: false,
                    success: null,
                    rolledAt: null
                });
            });
        });
        root.querySelectorAll(".ds-camp-setup-roll").forEach(button => {
            button.addEventListener("click", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.rollCampSetupRole(actorId, { disadvantage: event.currentTarget.dataset.disadvantage === "true" });
            });
        });
        root.querySelector("#ds-camp-setup-close")?.addEventListener("click", async () => {
            await Darksheet.closeCampSetup();
        });
    }
}

class DarksheetCampfire {
    static _dialog = null;

    static visibleCharacters() {
        return game.actors.filter(actor => actor.type === "character");
    }

    static buildContent(state) {
        const characters = this.visibleCharacters();
        const isGM = game.user.isGM;
        const activityDc = Number(state.activityDc ?? 10);
        const slots = characters.map((actor, i) => {
            const playerState = state.players?.[actor.id] ?? {};
            const isMine = isGM || actor.testUserPermission?.(game.user, "OWNER");
            const angle = (360 / Math.max(1, characters.length)) * i - 90;
            const opts = Object.entries(CAMP_ACTIVITIES)
                .map(([key, a]) => `<option value="${key}"${playerState.activity === key ? " selected" : ""}>${a.label}</option>`).join("");
            const selectedActivity = playerState.activity ? CAMP_ACTIVITIES[playerState.activity] : null;
            return `
                <div class="ds-campfire-slot${isMine ? " is-owner" : ""}${playerState.rollResult != null ? " has-rolled" : ""}"
                     style="--slot-angle:${angle}deg;"
                     data-actor-id="${actor.id}">
                    <div class="ds-campfire-card">
                        <img class="ds-campfire-portrait" src="${actor.img}" alt="${actor.name}">
                        <div class="ds-campfire-name">${actor.name}</div>
                        <select class="ds-campfire-activity" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                            <option value="">\u2014 Pick activity \u2014</option>
                            ${opts}
                        </select>
                        ${selectedActivity ? `<div class="ds-campfire-activity-note">${selectedActivity.note}</div>` : ""}
                        <div class="ds-campfire-roll-row">
                            <button type="button" class="ds-campfire-roll" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                                <i class="fa-solid fa-dice-d20"></i> Roll
                            </button>
                            <span class="ds-campfire-result">${playerState.rollResult != null ? playerState.rollResult : "\u2014"}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="ds-campfire ${state.lit ? "is-lit" : ""}">
                <div class="ds-campfire-status">
                    <strong>Camp activities</strong>
                    <span>Activity DC ${activityDc}</span>
                </div>
                <div class="ds-campfire-stage">
                    <div class="ds-campfire-fire" aria-hidden="true">
                        <span class="ds-campfire-flame ds-campfire-flame--1"></span>
                        <span class="ds-campfire-flame ds-campfire-flame--2"></span>
                        <span class="ds-campfire-flame ds-campfire-flame--3"></span>
                        <span class="ds-campfire-logs"></span>
                    </div>
                    ${slots}
                </div>
                <footer class="ds-campfire-footer">
                    ${isGM ? `<button type="button" class="ds-action" id="ds-camp-light">${state.lit ? "Snuff Fire" : "Light Fire"}</button>` : ""}
                    ${isGM ? `<button type="button" class="ds-action ds-action-danger" id="ds-camp-end">End Camp</button>` : ""}
                </footer>
            </div>
        `;
    }

    static async openLocal() {
        const state = await getCampfireState();
        if (game.user.isGM && !state?.active) await ensureCampfireState({ active: true, started: Date.now() });
        if (this._dialog?.rendered) {
            this.applyState(await getCampfireState());
            return;
        }
        const content = this.buildContent(await getCampfireState());
        this._dialog = new Dialog({
            title: "Campfire",
            content,
            buttons: {},
            close: () => { this._dialog = null; }
        }, { classes: ["dialog", "darksheet-dialog", "ds-campfire-dialog"], width: 780, height: 760, resizable: true });
        this._dialog.render(true);

        Hooks.once("renderDialog", (app, html) => {
            if (app !== this._dialog) return;
            this.wire(html[0]);
        });
    }

    static async applyState(state) {
        if (!this._dialog?.rendered) return;
        const html = this._dialog.element[0];
        const newContent = this.buildContent(state);
        const container = html.querySelector(".dialog-content");
        if (!container) return;
        container.innerHTML = newContent;
        this.wire(container);
    }

    static closeLocal() {
        if (this._dialog?.rendered) this._dialog.close({ force: true });
        this._dialog = null;
    }

    static wire(root) {
        root.querySelectorAll(".ds-campfire-activity").forEach(select => {
            select.addEventListener("change", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.updateCampfirePlayer(actorId, { activity: event.currentTarget.value || null });
            });
        });
        root.querySelectorAll(".ds-campfire-roll").forEach(button => {
            button.addEventListener("click", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.rollCampfireActivity(actorId);
            });
        });
        root.querySelector("#ds-camp-light")?.addEventListener("click", () => Darksheet.lightCampfire());
        root.querySelector("#ds-camp-end")?.addEventListener("click", () => Darksheet.closeCampfire());
    }
}

/* =====
 CITY LONG REST DIALOG - one-week-in-sanctuary party flow
 ===== */
class DarksheetCityRest {
    static _dialog = null;

    static visibleCharacters() {
        return game.actors.filter(actor => actor.type === "character" && actor.hasPlayerOwner);
    }

    static buildContent(state) {
        const characters = this.visibleCharacters();
        const isGM = game.user.isGM;
        const defaultLifestyle = state.lifestyle || "comfortable";

        const rows = characters.map(actor => {
            const ps = state.players?.[actor.id] ?? {};
            const isMine = isGM || actor.testUserPermission?.(game.user, "OWNER");
            const lifestyleKey = ps.lifestyle || defaultLifestyle;
            const lifestyle = DARKSCREEN_LIFESTYLES[lifestyleKey] ?? DARKSCREEN_LIFESTYLES.comfortable;
            const lifestyleOpts = Object.entries(DARKSCREEN_LIFESTYLES)
                .map(([k, l]) => `<option value="${k}"${k === lifestyleKey ? " selected" : ""}>${l.label} (${l.cost} gp)</option>`).join("");
            const activityOpts = Object.entries(LONG_REST_ACTIVITIES)
                .map(([k, a]) => `<option value="${k}"${ps.activity === k ? " selected" : ""}>${a.label}</option>`).join("");
            const selectedActivity = ps.activity ? LONG_REST_ACTIVITIES[ps.activity] : null;
            const hasRolled = ps.rollResult != null;
            const needsRoll = !!selectedActivity?.roll;
            const lifestyleEffects = formatLifestyleEffects(lifestyleKey);

            // Resolve column: roll button (if needed), narrative tag (if not), or empty placeholder.
            let resolveCell = "";
            if (selectedActivity && needsRoll) {
                resolveCell = `
                    <button type="button" class="ds-cityrest-roll ds-action" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"} title="Roll for this activity">
                        <i class="fa-solid fa-dice-d20"></i>
                    </button>
                    <span class="ds-cityrest-result${hasRolled ? " has-rolled" : ""}">${hasRolled ? ps.rollResult : "\u2014"}</span>
                `;
            } else if (selectedActivity) {
                resolveCell = `
                    <span class="ds-cityrest-narrative" title="No roll \u2014 narrative outcome at end of week"><i class="fa-solid fa-feather"></i></span>
                    <span class="ds-cityrest-result is-narrative">\u2014</span>
                `;
            } else {
                resolveCell = `<span class="ds-cityrest-narrative is-empty"></span><span class="ds-cityrest-result">\u2014</span>`;
            }

            return `
                <div class="ds-cityrest-row${isMine ? " is-owner" : ""}${hasRolled ? " has-rolled" : ""}" data-actor-id="${actor.id}">
                    <img class="ds-cityrest-portrait" src="${actor.img}" alt="${actor.name}">
                    <div class="ds-cityrest-body">
                        <div class="ds-cityrest-row-top">
                            <span class="ds-cityrest-name">${actor.name}</span>
                            <label class="ds-cityrest-lifestyle-field">
                                <i class="fa-solid fa-house-chimney"></i>
                                <select class="ds-cityrest-lifestyle" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>${lifestyleOpts}</select>
                            </label>
                        </div>
                        <div class="ds-cityrest-lifestyle-effects">${lifestyleEffects}</div>
                        <div class="ds-cityrest-controls">
                            <select class="ds-cityrest-activity" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                                <option value="">\u2014 Pick activity \u2014</option>
                                ${activityOpts}
                            </select>
                            ${resolveCell}
                        </div>
                        ${selectedActivity ? `<div class="ds-cityrest-note">${selectedActivity.note}</div>` : ""}
                    </div>
                </div>
            `;
        }).join("");

        return `
            <div class="ds-cityrest">
                <header class="ds-cityrest-header">
                    <span class="ds-cityrest-title"><i class="fa-solid fa-city"></i> One week in a sanctuary \u2014 each player picks their own lifestyle and activity.</span>
                </header>
                <div class="ds-cityrest-list">
                    ${rows || `<p class="ds-cityrest-empty">No player-owned characters found.</p>`}
                </div>
                <footer class="ds-cityrest-footer">
                    ${isGM ? `<button type="button" class="ds-action ds-action-success" id="ds-cityrest-end"><i class="fa-solid fa-bed-pulse"></i> End Week &amp; Settle Up</button>` : ""}
                </footer>
            </div>
        `;
    }

    static async openLocal() {
        const state = await getCityRestState();
        if (game.user.isGM && !state?.active) await ensureCityRestState({ active: true, started: Date.now() });
        if (this._dialog?.rendered) {
            this.applyState(await getCityRestState());
            return;
        }
        const content = this.buildContent(await getCityRestState());
        this._dialog = new Dialog({
            title: "City Sanctuary: Long Rest",
            content,
            buttons: {},
            close: () => { this._dialog = null; }
        }, { classes: ["dialog", "darksheet-dialog", "ds-cityrest-dialog"], width: 660, height: 620, resizable: true });
        this._dialog.render(true);

        Hooks.once("renderDialog", (app, html) => {
            if (app !== this._dialog) return;
            this.wire(html[0]);
        });
    }

    static async applyState(state) {
        if (!this._dialog?.rendered) return;
        const html = this._dialog.element[0];
        const newContent = this.buildContent(state);
        const container = html.querySelector(".dialog-content");
        if (!container) return;
        container.innerHTML = newContent;
        this.wire(container);
    }

    static closeLocal() {
        if (this._dialog?.rendered) this._dialog.close({ force: true });
        this._dialog = null;
    }

    static wire(root) {
        root.querySelectorAll(".ds-cityrest-lifestyle").forEach(select => {
            select.addEventListener("change", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.updateCityRestPlayer(actorId, { lifestyle: event.currentTarget.value });
            });
        });
        root.querySelectorAll(".ds-cityrest-activity").forEach(select => {
            select.addEventListener("change", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.updateCityRestPlayer(actorId, { activity: event.currentTarget.value || null, rollResult: null });
            });
        });
        root.querySelectorAll(".ds-cityrest-roll").forEach(button => {
            button.addEventListener("click", async event => {
                const actorId = event.currentTarget.dataset.actorId;
                await Darksheet.rollCityRestActivity(actorId);
            });
        });
        root.querySelector("#ds-cityrest-end")?.addEventListener("click", () => Darksheet.endCityRest());
    }
}

Hooks.once("ready", () => {
    darksheetUpdateDreadZoneBanner();
    if (!game.socket) return;
    const recipeListSetting = source => source === "public" ? "publicRecipes" : source === "shared" ? "sharedRecipes" : "";
    const notifyRecipeListChanged = () => {
        try { window.dispatchEvent(new CustomEvent("darksheetRecipeListsChanged")); } catch (e) {}
    };
    const recipeEntryKey = entry => String(entry?.uuid || entry?.id || "").trim();
    const applyRecipeListUpdate = async payload => {
        if (!game.user.isGM || !(game.users.activeGM?.isSelf ?? true)) return;
        const settingKey = recipeListSetting(payload.source);
        if (!settingKey) return;
        const current = game.settings.get("darksheet", settingKey);
        const entries = Array.isArray(current) ? foundry.utils.deepClone(current) : [];
        const key = recipeEntryKey(payload.entry) || String(payload.uuid || "").trim();
        if (!key) return;
        let next = entries.filter(entry => recipeEntryKey(entry) !== key);
        if (payload.action === "add" && payload.entry) next.push(payload.entry);
        else if (payload.action !== "remove") return;
        next.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
        await game.settings.set("darksheet", settingKey, next);
        notifyRecipeListChanged();
        game.socket.emit("module.darksheet", { type: "recipeListsChanged" });
    };
    game.socket.on("module.darksheet", payload => {
        if (!payload) return;
        if (payload.type === "campSetupOpen") DarksheetCampSetup.openLocal();
        else if (payload.type === "campSetupUpdate") DarksheetCampSetup.applyState(payload.state || {});
        else if (payload.type === "campSetupClose") {
            if (DarksheetCampSetup._dialog?.rendered) DarksheetCampSetup._dialog.close({ force: true });
            DarksheetCampSetup._dialog = null;
        }
        else if (payload.type === "campfireOpen") DarksheetCampfire.openLocal();
        else if (payload.type === "campfireUpdate") DarksheetCampfire.applyState(payload.state || {});
        else if (payload.type === "campfireClose") DarksheetCampfire.closeLocal();
        else if (payload.type === "cityRestOpen") DarksheetCityRest.openLocal();
        else if (payload.type === "cityRestUpdate") DarksheetCityRest.applyState(payload.state || {});
        else if (payload.type === "cityRestClose") DarksheetCityRest.closeLocal();
        else if (payload.type === "campStateWrite") {
            if (game.user.isGM && (game.users.activeGM?.isSelf ?? true)) {
                const CAMP_WRITE_OPS = { updateCampSetupPlayer: 1, updateCampfirePlayer: 1, lightCampfire: 1, setCityRestLifestyle: 1, updateCityRestPlayer: 1 };
                if (CAMP_WRITE_OPS[payload.op] && typeof Darksheet[payload.op] === "function") {
                    Promise.resolve(Darksheet[payload.op](...(payload.args || []))).catch(e => console.warn("Darksheet | campStateWrite failed", e));
                }
            }
        }
        else if (payload.type === "nodeDeplete") {
            // Only the primary GM applies the scene Note change (players can't).
            if (game.user.isGM && (game.users.activeGM?.isSelf ?? true)) DSNODE._applyDeplete(payload.sceneId, payload.noteId, payload.quantity);
        }
        else if (payload.type === "harvestDeplete") {
            if (game.user.isGM && (game.users.activeGM?.isSelf ?? true)) DSHARVEST._applyDeplete(payload.sceneId, payload.tokenId, payload.measures, payload.taken);
        }
        else if (payload.type === "recipeListUpdate") applyRecipeListUpdate(payload);
        else if (payload.type === "recipeListsChanged") notifyRecipeListChanged();
    });
});
