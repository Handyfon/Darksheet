import {
    applications
} from "../../../../systems/dnd5e/dnd5e.mjs"

let activateDDTab = false;

const DARKSCREEN_STORE_DEFAULTS = {
    version: 1,
    lastpage: "party",
    journey: { list: {}, activeId: null },
    disposition: { list: [] },
    dread: { list: {}, activeId: null },
    diseases: { list: [], custom: {}, dismissedReminder: "" },
    itemTempering: {},
    grimoire: {
        url: "https://giffyglyph.com/darkerdungeons/grimoire/4.0.0/en/contents.html",
        bookmarks: []
    },
    resting: { campingDc: "10", lookout: "", campFailures: "—", campActivityDc: "—", campLookoutResult: "—", lifestyle: "comfortable" },
    campfire: { active: false },
    cityRest: { active: false },
    campSetup: { active: false, players: {} }
};

//Register Sheet
Hooks.once('init', function() {
    //console.log("Darker DnD | Initializing Darker Dungeons for the D&D 5th Edition System\n", "_____________________________________________________________________________________________\n", "  ____                _                 ____                                                \n", " |  _ \\   __ _  _ __ | | __ ___  _ __  |  _ \\  _   _  _ __    __ _   ___   ___   _ __   ___ \n", " | | | | / _` || '__|| |/ // _ \| '__|  | | | || | | || '_ \\  / _` | / _ \\ / _ \\ | '_ \\ / __| \n", " | |_| || (_| || |   |   <|  __/| |    | |_| || |_| || | | || (_| ||  __/| (_) || | | |\\__ \\ \n", " |____/  \\__,_||_|   |_|\\_\\\\___||_|    |____/  \\__,_||_| |_| \\__, | \\___| \\___/ |_| |_||___/ \n", "                                                             |___/                          \n", "_____________________________________________________________________________________________");
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
    game.settings.register('darksheet', 'equippedDontUseSlots', {
        name: 'Equipped Item Behaviour',
        hint: 'When enabled, equipped items dont count towards your carry capacity.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
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
    }, { render: false });   // don't cascade-rerender — caller is mid-render
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
    return clampExhaustion(actor?.system?.attributes?.exhaustion ?? 0);
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
    await darksheetEnsureFlags(actor);
    const currentTotal = getActorExhaustion(actor);
    const previous = actor.flags?.darksheet?.exhaustionAutomation ?? {};
    const previousAppliedValue = Number(previous.applied ?? previous.module);
    const previousApplied = Number.isFinite(previousAppliedValue) ? Math.max(0, previousAppliedValue) : 0;
    const manual = clampExhaustion(currentTotal - previousApplied);
    const calculated = calculateDarksheetExhaustion(actor);
    const automatableExhaustion = Math.max(0, calculated.module);
    const total = clampExhaustion(manual + automatableExhaustion);
    const applied = total - manual;
    const sourcesChanged = JSON.stringify(previous.sources ?? {}) !== JSON.stringify(calculated.sources);

    if (
        currentTotal === total
        && clampExhaustion(previous.manual ?? 0) === manual
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
    // dnd5e 5.x / Foundry v14 ApplicationV2 sheets pass html as an HTMLElement.
    // Wrap it in jQuery so the rest of the module (which is jQuery-based) keeps working.
    if (!(html instanceof jQuery)) html = $(html);
    // Ensure the actor has the darksheet flag scaffolding the rest of the
    // module assumes is present (new actors won't have it yet).
    await darksheetEnsureFlags(app.actor);
    await syncDarksheetExhaustion(app.actor, { render: false });
    const element = document.querySelector('a.item.active');
    if (element) {
        element.focus();
    }

    addStressBar(app, html, data);
    applySpellBurnoutToSheet(app, html, data);
    applyWeaponInventoryQuantityVisibility(app, html);

    darkSheetSetup(app, html, data);
    if (!game.settings.get('darksheet', 'disableWoundSystem')) {
        addWoundsToSheet(app, html, data);
    }
    styleDarksheetExhaustionPips(app, html, app.actor);
    setTimeout(() => {
        // Blur the active element after reload
        document.activeElement.blur();
    }, 0);
}
// Legacy V1 sheet hook (older Foundry / older dnd5e).
Hooks.on('renderActorSheet', darksheetRenderActorSheet);
// dnd5e 5.x V2 sheets — listen to the *most specific* hook only.
// renderBaseActorSheet would also fire for CharacterActorSheet, causing the
// handler to run twice per render (stress bar duplicated, etc.).
Hooks.on('renderCharacterActorSheet', darksheetRenderActorSheet);

function darksheetUpdateTouchesExhaustion(changed) {
    const flattened = foundry.utils.flattenObject?.(changed ?? {}) ?? {};
    return Object.keys(flattened).some(key =>
        key === "system.attributes.exhaustion"
        || key.startsWith("flags.darksheet.attributes.saturation")
        || key.startsWith("flags.darksheet.attributes.thirst")
        || key.startsWith("flags.darksheet.attributes.fatigue")
        || key.startsWith("flags.darksheet.attributes.temp")
        || key.startsWith("flags.darksheet.woundlist")
        || key.startsWith("flags.darksheet.exhaustionAutomation")
    );
}

Hooks.on("updateActor", (actor, changed, options) => {
    if (options?.darksheetExhaustionSync) return;
    if (actor?.type !== "character") return;
    if (!darksheetUpdateTouchesExhaustion(changed)) return;
    syncDarksheetExhaustion(actor, { render: false });
});

function registerDarkSheetTabPart() {
    const CharacterActorSheet = applications.actor?.CharacterActorSheet;
    if (!CharacterActorSheet) {
        console.warn("Darksheet | dnd5e CharacterActorSheet was not available; Darker Dungeons tab was not registered.");
        return;
    }

    if (!CharacterActorSheet.TABS.some(tab => tab.tab === "dd")) {
        CharacterActorSheet.TABS = [
            ...CharacterActorSheet.TABS,
            { tab: "dd", label: "Darker Dungeons", icon: "fas fa-skull" }
        ];
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
            const spellBurnoutTemplate = await renderTemplate("modules/darksheet/templates/spellburnout.html", templateData);
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

    let inventoryAdditionsTemplate = await renderTemplate("modules/darksheet/templates/fatigue.html", data);

    // Convert the HTML string into DOM elements
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = inventoryAdditionsTemplate;
    container.append(tempDiv.children)
}

async function applyInventoryAdditions(app, html, data) {
    let inventoryContainer = html.find(".inventory-element");

    if (inventoryContainer.length > 0) {
        let inventoryAdditionsTemplate = await renderTemplate("modules/darksheet/templates/inventoryAdditions.html", data);

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
    // dnd5e 5.x V2 sheets pass a different prepared context — pull the actor
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
            let stressBarTemplate = await renderTemplate("modules/darksheet/templates/stressbar.html", data);
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
// dnd5e 5.x also fires renderItemSheet5e for the base item sheet — wire the same.
Hooks.on(`renderItemSheet5e`, (app, html, data) => {
    if (!(html instanceof jQuery)) html = $(html);
    loadItemData(app, html, data);
});

Hooks.on("preCreateItem", (item) => {
    if (!darksheetSilverStandardEnabled()) return;
    darksheetDefaultItemPriceDenomination(item, { persist: false, includePriced: true, stepSilver: true });
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

async function loadItemData(app, html, data) {
    console.log("Loading Darksheet item data...");
    const item = app?.item ?? app?.document ?? data?.item;
    if (!item) return;
    if (item.type === "spell" || item.type === "feat" || item.type === "class") return; //DISABLE SPELL AND FEATURES
    await darksheetDefaultItemPriceDenomination(item);

    data.item ??= item;
    data.NotEditable = !isDarkSheetItemEditable(app, html, data);
    let itemDataTemplate = await renderTemplate("modules/darksheet/templates/itemdata.html", data);

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
            <small>${treatedCount}/${activeCount} treated · ${healedCount} old</small>
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
    let DeathSaves = await renderTemplate("modules/darksheet/templates/deathsaves.html", data);
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

    let maxSlots = 18;
    let percentage = 0;
    let STRBONUS = actor.system.abilities.str.value * Math.max(1, Math.min(actor.system.attributes.encumbrance.mod, 8));

    if (actor.flags.darksheet && actor.flags.darksheet.attributes) {
        switch (actor.system.traits.size) {
            case "tiny":
                maxSlots = 6;
                break;
            case "sm":
                maxSlots = 14;
                break;
            case "med":
                maxSlots = 18;
                break;
            case "lg":
                maxSlots = 22;
                break;
            case "huge":
                maxSlots = 30;
                break;
            case "grg":
                maxSlots = 46;
                break;
            default:
                maxSlots = 18;
                break;
        }

        maxSlots += STRBONUS;
    }
    percentage = (currentSlots / maxSlots) * 100;

    if (game.settings.get('darksheet', 'slotbasedinventory')) { // IF SLOTS ARE ENABLED
        //SET ENCUMBRANCE BAR
        let encumbrance = html.find(".encumbrance").find(".meter");
        // dnd5e 5.x reworked the sheet — the legacy encumbrance markup may not
        // exist. Guard each lookup so the rest of darkSheetSetup still runs.
        if (encumbrance.length && encumbrance[0]) {
            const currentValue = encumbrance.find("div").find(".value")[0];
            if (currentValue) currentValue.textContent = parseFloat(currentSlots).toFixed(1);
            const maxValue = encumbrance.find("div").find(".max")[0];
            if (maxValue) maxValue.textContent = maxSlots + " Slots";
            const multiplier = html.find(".encumbrance").find(".info").find(".multiplier").find(".value")[0];
            if (multiplier) multiplier.textContent = "x" + Math.max(1, Math.min(actor.system.attributes.encumbrance.mod, 8));

            const size = html.find(".encumbrance").find(".info").find(".size");
            if (size.length) {
                const sizeVal = size.find(".value")[0];
                if (sizeVal) sizeVal.textContent = "+" + (maxSlots - STRBONUS);
                const sizeLbl = size.find(".label")[0];
                if (sizeLbl) sizeLbl.textContent = "Size-Slots";
                size.appendTo(size.parent());
            }

            if (percentage <= 100)
                encumbrance[0].style = "--bar-percentage:" + Math.min(percentage, 100) + "%;";
            else
                encumbrance[0].style = "background: red;border: 2px solid red;--bar-percentage:" + Math.min(percentage, 100) + "%;";

            //SET BAR ARROWS — only if they still exist
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
        const darksheetItem = _item.flags?.darksheet?.item;
        const missingFragility = darksheetItem?.fragility === undefined || darksheetItem?.fragility === null || darksheetItem?.fragility === "";
        const needsDefaultWeaponFragility = _item.type === "weapon" && missingFragility;
        const missingSlots = darksheetItem?.slots === undefined || darksheetItem?.slots === null;
        if (!darksheetItem || needsDefaultWeaponFragility || (automaticFragility && missingFragility) || (automaticSlots && missingSlots)) {
            //try find slot
            let slot = darksheetItem?.slots ?? 1;
            let fragility = darksheetItem?.fragility ?? "";
            if (needsDefaultWeaponFragility) fragility = 10;
            for (const [itemName, bulkValue] of Object.entries(itemBulk)) {

                if (_item.name.includes(itemName)) {
                    // Handle slot assignment based on automaticSlots setting
                    if (automaticSlots) {
                        slot = bulkValue;
                        console.log(`Darksheet | ${_item.name} is assigned ${slot} slots.`);
                    }

                    // Check fragility based on automaticFragility setting
                    if (automaticFragility && missingFragility) {
                        if (isItemFragile(_item.name)) {
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
                itemname =  "["+notchOptions[_item.flags.darksheet.item.fragility] + "] " + itemname;
                }*/
                
                item.children[0].children[0].children[1].children[0].innerHTML = itemname;

                //TEMPER
                if (itemData.temper) {
                    let temper = itemData.temper;
                    let temperLabel = document.createElement("span");
                    temperLabel.classList.add("DarktemperLabel","darktemper"+temper);
                    temperLabel.textContent = temper.charAt(0).toUpperCase() + temper.slice(1);
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
                    let qualityLabel = document.createElement("span");
                    qualityLabel.classList.add("DarkQualityLabel","darkQuality"+quality);
                    qualityLabel.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
                    item.classList.add(quality);
                    let titleElement = item.getElementsByClassName("title")[0];
                    if (titleElement) {
                        titleElement.prepend(qualityLabel); // Prepend the quality label
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
            badge.setAttribute("title", `Ammodie: ${ammodie} — click to roll`);
            badge.innerHTML = `<i class="fas fa-dice-${ammodie}" inert></i> ${ammodie}`;
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
        if (data.options.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | Unlinked tokens are not supported.");
            return;
        }
        await rollBurnout(actor);
    });
    html.find('.tableCheck').click(async (event) => {
        event.preventDefault();
        rollFromTable(event.target.getAttribute("tableCheck"));
    });
    html.find('.item-ammodieLabel').click(async (event) => {
        event.preventDefault();
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
    // live references — pull straight from `app` (the sheet instance).
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
    let currentAmmodie = item.flags?.darksheet?.item?.ammodie;
    if (!currentAmmodie) return;
    let newAmmodie = currentAmmodie;
    let roll = await new Roll("1" + currentAmmodie).evaluate();
    let rollResult = roll._total;
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

}

async function rollBurnout(actor) {
    let burnoutDie = actor.flags.darksheet.attributes.burnout.value;
    let newBurnoutDie = burnoutDie;
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

    var regionMod = parseInt(actor.flags.darksheet.attributes.regionmod.value, 10);
    if (regionMod < 0) { //IF NEGATIVELY AFFECTED BY REGION
        regionMod = burnoutArray.indexOf(burnoutDie) - parseInt(actor.flags.darksheet.attributes.regionmod.value);
        //console.log("Regionmodz step2 kleiner: "+regionmodz);
        if (regionMod >= 5) {
            regionMod = 4;
        }
    } else { //IF POSITIVELY AFFECTED BY REGION
        regionMod = burnoutArray.indexOf(burnoutDie) - parseInt(actor.flags.darksheet.attributes.regionmod.value);
        //console.log("Regionmodz step3 gr��er: "+regionmodz);
        if (regionMod <= 0) {
            regionMod = 0;
        }
    }
    var regionDice = burnoutArray[regionMod];
    let regiontext = regionDict["" + actor.flags.darksheet.attributes.regionmod.value] + " [d" + regionDice + "] ";
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

            let content = `
                <div class="dnd5e chat-card item-card darksheet-chat-card">
                    <header class="card-header flexrow">
                        <img src="${actor.prototypeToken.texture.src}" title="" width="36" height="36" style="border: none;"/> <h3 class="darksheet-chat-title">${actor.name}'s </h3>
                    </header>
                    <label style="font-size: 14px;">${name} just shattered</label>
                </div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
            if (rollMode === "blindroll") rollBlind = true;
            ChatMessage.create({
                user: game.user.id,
                content: content,
                speaker: {
                    actor: actor.id,
                    token: actor.token,
                    alias: actor.name
                },
                sound: CONFIG.sounds.dice,
            });

        }

    }
    //VALUE CALCULATION==========================================
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

    if (darksheet.type === "equipment") { //ARMOR CALCULATION==========================================
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

    /* =====================================================================
       JOURNEY UPKEEP — party-wide stamina checks and food/water adjustments
       ===================================================================== */
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
            morning: { food: 0, water: 0, fatigue: 0, label: "Morning", icon: "fa-cloud-sun" },
            dusk:    { food: 1, water: 1, fatigue: 1, label: "Dusk",    icon: "fa-moon" },
            night:   { food: 0, water: 0, fatigue: 1, label: "Night",   icon: "fa-moon" }
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
            .join(" · ");
        const bodyHtml = effectsText
            ? `<p><strong>${effectsText}</strong></p><p>${affected.length ? affected.join(", ") : "No characters affected."}</p>`
            : `<p><em>Phase marker — no automatic effects.</em></p>`;
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
        ui.notifications.notify(`Darksheet | ${labelMap[kind]} ${step > 0 ? "+" : ""}${step * magnitude} — ${changed} character${changed === 1 ? "" : "s"} updated.`);
        return changed;
    }
    static async changeDread(amount) {
        const screenData = await ensureDarkscreenFlags();
        const raw = screenData.dread ?? {};

        // Resolve the active zone — handles both new and legacy shapes.
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
                activeId: id
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

    /* =====================================================================
       OUTSIDE CAMP — Darker Dungeons short rest helpers
       ===================================================================== */
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
            lines.push(`<strong>${actor.name}</strong>: ${total} vs DC ${dc} — ${success ? "✓" : "✗"}`);
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
            flavor: `Lookout — DC ${dc} ${success ? "✓ Defenses secured" : "✗ Disadvantage on perception vs intruders"}`
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
            lines.push(`<strong>${actor.name}</strong>: ${total} vs DC ${dc} — ${success ? "✓ slept well (+1 hit die)" : "✗ restless"}`);
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
            flavor: `Long Rest Complication — ${triggered ? "⚠ Something unfortunate happens this week" : "No complication this week"}`
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
            if (result) lines.push(`${i + 1}. ${result.text ?? result.name ?? "Rumor"}`);
        }
        await Darksheet.postDarkscreenChat({
            title: "Rumors Heard This Week",
            icon: "fa-solid fa-comments",
            whisper: "gm",
            body: `<p>${lines.join("<br>")}</p>`
        });
    }
    /* =====================================================================
       MAGICAL ENCHANTMENTS — applied to dnd5e 5.x items
       ===================================================================== */
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
                // Enhancement bonus → magicalBonus
                if (enchantment.plus > 0) {
                    updateData['system.magicalBonus'] = enchantment.plus;
                }
                // Elemental damage → push an extra damage part
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

    /* =====================================================================
       CAMPFIRE — shared resting dialog with player activity picks + self-rolls
       ===================================================================== */
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

        await Darksheet._finalizeCampSetupIfReady();
        return { actorId, total, success };
    }

    static async _finalizeCampSetupIfReady() {
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
            return `<strong>${actor.name}</strong>: ${role}${entry.disadvantage ? " (disadvantage)" : ""} ${entry.rollResult} vs DC ${state.dc} — ${entry.success ? "✓" : "✗"}`;
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
        const state = await getCampfireState();
        state.players ??= {};
        state.players[actorId] = { ...(state.players[actorId] ?? {}), ...patch };
        await setCampfireState(state);
        game.socket.emit("module.darksheet", { type: "campfireUpdate", state });
        DarksheetCampfire.applyState(state);
    }

    static async lightCampfire() {
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

        // Camp activity DC — default 10 (a "decent campsite" per Darker Dungeons).
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
                        return { text: `Regained <strong>1 hit die</strong> (${key}, ${used} → ${used - 1}).` };
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
                return { text: `🎲 <strong>1d4 = ${delta}</strong>. Stress ${current} → ${next}.` };
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
                        lines.push(`${a.name}: ${current} → ${next}`);
                    }
                }
                return { text: `🎲 <strong>1d4 = ${delta}</strong>. Party stress reduced:<br>${lines.length ? lines.join("<br>") : "<em>Nobody had stress to reduce.</em>"}` };
            }
            case "mend": {
                const item = await Darksheet._promptCampMend(actor);
                if (!item) return { text: "<em>No notched item selected.</em>" };
                const notches = Number(item.flags?.darksheet?.item?.notches ?? 0);
                if (notches <= 0) return { text: `<strong>${item.name}</strong> has no notches.` };
                await item.update({ 'flags.darksheet.item.notches': notches - 1 });
                return { text: `Mended <strong>${item.name}</strong>: ${notches} → ${notches - 1} notch${notches - 1 === 1 ? "" : "es"}.` };
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
                return { text: "On lookout duty — alert for intruders this turn." };
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
                return `<option value="${i.id}">${i.name} — ${notches} notch${notches === 1 ? "" : "es"}</option>`;
            }).join("");
            new Dialog({
                title: `${actor.name} — Mend Item`,
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
                title: `${actor.name} — Tend Wound`,
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

    /* =====================================================================
       CITY LONG REST — Darker Dungeons "1 week in sanctuary" party dialog
       ===================================================================== */
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
        const state = await getCityRestState();
        state.lifestyle = key;
        await setCityRestState(state);
        game.socket.emit("module.darksheet", { type: "cityRestUpdate", state });
        DarksheetCityRest.applyState(state);
    }

    static async updateCityRestPlayer(actorId, patch = {}) {
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
            // Rest & Relaxation — automatic 2d6 stress reduction, no check.
            const roll = await new Roll("2d6").evaluate();
            total = roll.total ?? roll._total;
            formula = "2d6";
            rollRender = await roll.render();
            await darksheetEnsureFlags(actor);
            const cur = Number(actor.flags?.darksheet?.attributes?.stress ?? 0);
            const next = Math.max(0, cur - total);
            if (next !== cur) await actor.update({ 'flags.darksheet.attributes.stress': next });
            resultText = `Stress healed: <strong>${cur} → ${next}</strong> (–${total}).`;
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
            lines.push(`<strong>${actor.name}</strong>: ${lifestyle?.label || lifestyleKey} — ${actLabel}`);
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
        // Re-render the template with fresh Darkscreen store data so saved
        // journey/dread/resting state is reflected after the reload.
        const screenData = await ensureDarkscreenFlags();
        const templateData = { data: { screenData }, title: "Darker Dungeons - Gamemaster Screen" };
        const newContent = await renderTemplate("modules/darksheet/templates/darkscreen.html", templateData);
        if (this._darkscreen.data) this._darkscreen.data.content = newContent;
        if (this._darkscreen.options) this._darkscreen.options.content = newContent;
        this._darkscreen.render(true);
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
        if (!game.user?.isGM || document.getElementById("DarkScreen-button")) return;

        const button = document.createElement("button");
        button.type = "button";
        button.id = "DarkScreen-button";
        button.className = "darkscreen-launcher";
        button.dataset.tooltip = "Darker Dungeons GM Screen";
        button.setAttribute("aria-label", "Open Darkscreen");
        button.innerHTML = `<i class="fas fa-book-dead" inert></i>`;
        button.addEventListener("click", event => {
            event.preventDefault();
            Darkscreen.initializeDarkscreen();
        });

        document.body.append(button);
    }

    static initializeDarkscreen() {
        if (!Darkscreen.dsc) Darkscreen.dsc = new DSC();
        Darkscreen.dsc.openDialog();

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
            activeId: id
        };
    }
    normalized.dread.activeId ??= null;
    if (!normalized.diseases || typeof normalized.diseases !== "object") normalized.diseases = { list: [], custom: {}, dismissedReminder: "" };
    normalized.diseases.list = Array.isArray(normalized.diseases.list) ? normalized.diseases.list : [];
    normalized.diseases.custom = normalized.diseases.custom && typeof normalized.diseases.custom === "object" && !Array.isArray(normalized.diseases.custom)
        ? normalized.diseases.custom
        : {};
    normalized.diseases.dismissedReminder ??= "";
    normalized.itemTempering = { ...(normalized.itemTempering ?? {}) };
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

Hooks.on('renderApplication', (app, html, options) => {
    if (app.title == "Darker Dungeons - Gamemaster Screen 2.0")
        Darksheet._darkscreen = app;
});
Hooks.on('closeApplication', (app, html, options) => {
    if (app.title == "Darker Dungeons - Gamemaster Screen 2.0")
        Darksheet._darkscreen = null;
});
// Intentionally no auto-reload on actor updates. Re-rendering the darkscreen
// on every actor field change wipes the active page and any in-flight UI state
// (journey form values, scroll position, etc.). Reloads are now triggered
// explicitly via Darksheet.darkScreenReload() by the code paths that need them.

class DSC extends Application {
    constructor(options = {}) {
        super(options);
    }
    async openDialog() {
        //LOAD TEMPLATE DATA
        if (Darksheet._darkscreen?.rendered) {
            await Darksheet._darkscreen.close();
            Darksheet._darkscreen = null;
            return;
        }

        const existingDialog = Object.values(ui.windows ?? {}).find(app => {
            const element = app?.element instanceof jQuery ? app.element[0] : app?.element;
            return element?.classList?.contains("DSC-window");
        });
        if (existingDialog) {
            await existingDialog.close();
            if (Darksheet._darkscreen === existingDialog) Darksheet._darkscreen = null;
            return;
        }

        const templateData = {
            data: []
        };
        templateData.data = super.getData();
        templateData.title = "Darker Dungeons - Gamemaster Screen";
        templateData.data.screenData = await ensureDarkscreenFlags();

        //LOAD DATA

        const templatePath = "modules/darksheet/templates/darkscreen.html";
        DSC.renderMenu(templatePath, templateData);

    }
    static renderMenu(path, data) {
        const dialogOptions = {
            width: 1200,
            height: 1200,
            classes: ['DSC-window resizable']
        };
        dialogOptions.resizable = true;
        renderTemplate(path, data).then(dlg => {
            const dialog = new Dialog({
                title: game.i18n.localize('Darker Dungeons - Gamemaster Screen 2.0'),
                content: dlg,
                buttons: {}
            }, dialogOptions);
            Darksheet._darkscreen = dialog;
            dialog.render(true);
        });
    }
}
Hooks.once('ready', async function() {
    if (game.user.isGM) {
        await ensureDarkscreenFlags();
        Darkscreen.addUiButton();
        window.setTimeout(() => Darksheet.checkDiseaseReminders(), 1000);
    }
});
Hooks.on("updateWorldTime", () => Darksheet.checkDiseaseReminders());
Hooks.on('canvasReady', function() {
    if (game.user.isGM) Darkscreen.addUiButton();
});

const itemBulk = {
    'Abacus': 1,
    'Acid (vial)': 0.2,
    'Alchemist’s Fire (flask)': 1,
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
    'Traveler’s Clothes': 1,
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
    'Healer’s': 1,
    'Herbalism': 1,
    'Mess': 1,
    'Poisoner’s': 1,
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
    'Miner’s': 3,
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
    'Scale, Merchant’s': 1,
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

function isItemFragile(itemName) {
    return fragileItems.some(fragileItem => itemName.includes(fragileItem));
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

/* =========================================================================
   CAMPFIRE — shared resting dialog
   ========================================================================= */
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
    return `${l.hp} HP · ${l.hitDice} HD · ${food} · ${water} · ${fatigue}`;
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
                            <option value="">— Pick setup role —</option>
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
                    <span class="ds-camp-setup-result">${playerState.rollResult != null ? `${playerState.rollResult}${playerState.disadvantage ? " dis." : ""} ${playerState.success ? "✓" : "✗"}` : "—"}</span>
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
        if (!state?.active) await ensureCampSetupState({ active: true, started: Date.now() });
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
                            <option value="">— Pick activity —</option>
                            ${opts}
                        </select>
                        ${selectedActivity ? `<div class="ds-campfire-activity-note">${selectedActivity.note}</div>` : ""}
                        <div class="ds-campfire-roll-row">
                            <button type="button" class="ds-campfire-roll" data-actor-id="${actor.id}" ${isMine ? "" : "disabled"}>
                                <i class="fa-solid fa-dice-d20"></i> Roll
                            </button>
                            <span class="ds-campfire-result">${playerState.rollResult != null ? playerState.rollResult : "—"}</span>
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
        if (!state?.active) await ensureCampfireState({ active: true, started: Date.now() });
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

/* =========================================================================
   CITY LONG REST DIALOG — one-week-in-sanctuary party flow
   ========================================================================= */
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
                    <span class="ds-cityrest-result${hasRolled ? " has-rolled" : ""}">${hasRolled ? ps.rollResult : "—"}</span>
                `;
            } else if (selectedActivity) {
                resolveCell = `
                    <span class="ds-cityrest-narrative" title="No roll — narrative outcome at end of week"><i class="fa-solid fa-feather"></i></span>
                    <span class="ds-cityrest-result is-narrative">—</span>
                `;
            } else {
                resolveCell = `<span class="ds-cityrest-narrative is-empty"></span><span class="ds-cityrest-result">—</span>`;
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
                                <option value="">— Pick activity —</option>
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
                    <span class="ds-cityrest-title"><i class="fa-solid fa-city"></i> One week in a sanctuary — each player picks their own lifestyle and activity.</span>
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
        if (!state?.active) await ensureCityRestState({ active: true, started: Date.now() });
        if (this._dialog?.rendered) {
            this.applyState(await getCityRestState());
            return;
        }
        const content = this.buildContent(await getCityRestState());
        this._dialog = new Dialog({
            title: "City Sanctuary — Long Rest",
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
    if (!game.socket) return;
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
    });
});
