import {
    applications
} from "../../../../systems/dnd5e/dnd5e.mjs"

let activateDDTab = false;

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

    game.settings.register('darksheet', 'hidechecks', {
        name: 'Hide "Checks" Section from Character Sheets',
        hint: 'When enabled, the "checks" section is hidden from all character sheets.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
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
    /*
    game.settings.register('darksheet', 'silverstandard', { //TODO silverstandard setting
    	name: '[Houserule] Silver Standard',
    	hint: 'When enabled, all items will have sp (silver pieces) value instead of gp (gold pieces).',
    	scope: 'world',
    	config: true,
    	default: false,
    	type: Boolean,
    });*/
    //TODO IMPLEMENT DARKSCREEN
    /*game.settings.register('darksheet', 'globalTemp', { //TODO GM MANAGED TEMPERATURE
    	name: 'GM-Managed Temperature',
    	hint: 'When enabled, players can no longer select their temperature on their character sheets. You can still change the regional magic as the GM or with the Darkscreen.',
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
        'modules/darksheet/templates/character-sheet.html'
    ]);
});

Hooks.on(`renderActorSheet`, (app, html, data) => {
    if (app.actor.type != 'character') return;
    const element = document.querySelector('a.item.active');
    if (element) {
        element.focus();
    }
    //This way to reactivate the tab is inspired by Ethck's 5e Downtime Tracking Module
    addDarkSheetTab(app, html, data).then(function() {
        if (app.activateDDTab) {
            app._tabs[0].activate("dd");
        }
    });

    addStressBar(app, html, data);
    applyInventoryAdditions(app, html, data);
    applyFatigueAndTemperatureAdditions(app, html, data);
    applySpellBurnoutToSheet(app, html, data);

    darkSheetSetup(app, html, data);
    if (!game.settings.get('darksheet', 'disableWoundSystem')) {
        addWoundsToSheet(app, html, data);
    }
    setTimeout(() => {
        // Blur the active element after reload
        document.activeElement.blur();
    }, 0);
});

async function applySpellBurnoutToSheet(app, html, data) {
    let container = html.find(".spells").find(".top");

    let inventoryAdditionsTemplate = await renderTemplate("modules/darksheet/templates/spellburnout.html", data);

    // Convert the HTML string into DOM elements
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = inventoryAdditionsTemplate;
    container.append(tempDiv.children)
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
    let stressValue = data.actor.flags.darksheet?.attributes?.stress ?? 0;

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
    data.showAffliction1 = stressValue >= 20 || data.actor.flags.darksheet.attributes.affliction1?.value !== "default";
    data.showAffliction2 = stressValue >= 30 || data.actor.flags.darksheet.attributes.affliction2?.value !== "default";
    data.showAffliction3 = stressValue >= 35 || data.actor.flags.darksheet.attributes.affliction3?.value !== "default";
    data.showBreakingPoint = stressValue >= 40;
    // Inject computed values
    data.stressMax = stressMax;

    let meterGroup = html.find(".meter-group").eq(1);
    if (meterGroup.length > 0) {
        let stressBarTemplate = await renderTemplate("modules/darksheet/templates/stressbar.html", data);
        meterGroup.append(stressBarTemplate);
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
    //Insert additional data
    loadItemData(app, html, data);
});

Hooks.on('preCreateChatMessage', (app, html, data) => {
    //console.log("Chat Message Detected");
    let actor = game.actors.get(app.speaker.actor);
    let item = actor.items.get(html.flags.dnd5e.item.id);
    let spellburnout = false;
    let iscantrip = false;

    if (item == null) return;

    if (item.system.level == 0) {
        iscantrip = true;
    }
    if (item.type == "spell") {
        spellburnout = true;
    } else {
        return;
    }

    if (!iscantrip && spellburnout && actor.flags.darksheet.attributes.autmomaticburnout && app.user.id === game.user.id || iscantrip && !game.settings.get('darksheet', 'savecantrips') && actor.flags.darksheet.attributes.autmomaticburnout && app.user.id === game.user.id) {
        //console.log("[Darksheet] Rolling automatic burnout for " + actor.name);
        rollBurnout(actor);
    }
});

async function loadItemData(app, html, data) {
    console.log("Loading Darksheet item data...");
    if (data.item.type == "Spell" || data.item.type  == "Feature") return; //DISABLE SPELL AND FEATURES

    data.NotEditable = !data.cssClass.includes("editable");
    let itemDataTemplate = await renderTemplate("modules/darksheet/templates/itemdata.html", data);

    const firstElement = html.find('.sheet-header').first();
    if (firstElement.length > 0) {
        firstElement.append(itemDataTemplate); // Append at the end instead of prepending
    } else {
        html.find('.item-properties').append(itemDataTemplate); // Fallback
    }
}

async function addWoundsToSheet(sheet, html, data) {

    let actor = sheet.actor;
    let woundlist = actor.flags.darksheet.woundlist;
    //console.log(actor.flags.darksheet);

    if (html.find("woundsection").count == 2) return;

    if (actor.flags.darksheet.woundlist == undefined) {
        await actor.update({
            'flags.darksheet.woundlist': []
        });
    }
    if (actor.flags.darksheet.displayOldWounds == undefined) {
        await actor.update({
            'flags.darksheet.displayOldWounds': false
        });
    }

    //RENDER WOUNDS
    var woundBarDiv = document.createElement("div");
    woundBarDiv.classList.add("pills-group", "woundsection", "woundS1");
    woundBarDiv.innerHTML = '<button type="button" class="rollable button" title="Click to roll for reopened wounds" class="deathsavelabel woundroll rollReopenWounds rollable" actorid="' + actor.id + '">Reopen Wounds</button><button type="button" class="rollable button addwoundbutton" id="addwound" actorID="' + sheet.actor.id + '"><i class="fas fa-plus"></i> Add Wound</button>';

    let woundTable = await renderTemplate("modules/darksheet/templates/wounds.html", data);

    let countersSection = html.find(".main-content").find(".tab-body").find(".details").find(".right").find(".flexrow");
    countersSection.after(woundTable);
    countersSection.after(woundBarDiv);

    let woundList = html.find(".woundlist");

    for (let count = 0; count < woundlist.length; count++) {
        let wound = woundlist[count];
        let label = wound.treated == false ? '<label class="exhaustiontip">+1 Exh.</label>' : '';
        let treated = wound.treated == true ? 'checked' : '';

        if (!wound.healed)
            await woundList.append('<tr id="woundtr"><td><input type="text" id="wounddes' + count + '" name="' + count + '" value="' + wound.location + '" placeholder="Where is this wound?"></td><td><input class="woundcheckbox" name="' + count + '" id="woundcheck' + count + '" type="checkbox" data-dtype="Boolean" ' + treated + '/></td><td><input class="removewoundbutton" name="' + count + '" type="button" id="wound1"value=""><i class="fa-light fa-bandage healWoundButton"></i></td><td>' + label + '</td></th></tr>');

        woundList.find("#wounddes" + count).on("change", async (ev) => {
            ev.preventDefault();
            // Handle the input change event
            //console.log("Input value changed:", ev.target.value);
            let actor = game.actors.get(ev.currentTarget.closest(".woundlist").getAttribute("actorid"));

            let _woundlist = actor.flags.darksheet.woundlist ? actor.flags.darksheet.woundlist : [];

            // EDIT WOUND
            _woundlist[ev.currentTarget.name].location = ev.target.value;

            await actor.setFlag('darksheet', 'woundlist', woundlist, {
                diff: true
            });
            await document.activeElement.blur();
        });

        woundList.find("#woundcheck" + count).on("change", async (ev) => {
            ev.preventDefault();
            let actor = game.actors.get(ev.currentTarget.closest(".woundlist").getAttribute("actorid"));

            let _woundlist = actor.flags.darksheet.woundlist ? actor.flags.darksheet.woundlist : [];

            _woundlist[ev.currentTarget.name].treated = ev.target.checked;

            await actor.setFlag('darksheet', 'woundlist', woundlist, {
                diff: true
            });
            await document.activeElement.blur();
        });

        woundList.find(".removewoundbutton[name='" + count + "']").on("click", async (ev) => {
            ev.preventDefault();
            let actor = game.actors.get(ev.currentTarget.closest(".woundlist").getAttribute("actorid"));
            let _woundlist = actor.flags.darksheet.woundlist ? actor.flags.darksheet.woundlist : [];
            // EDIT WOUND
            _woundlist[ev.currentTarget.name].healed = true;
            getTimeStamp().then((timestamp) => {
                _woundlist[ev.currentTarget.name].healedDate = timestamp;
            });
            await actor.update({
                'flags.darksheet.woundlist': woundlist
            });
            await document.activeElement.blur();
        });
    }
    if (actor.flags.darksheet.displayOldWounds) {
        await woundList.append('<tr id="oldwounds" actorid="' + actor.id + '"><td colspan="4" class="oldWoundsColspan"><label class="oldWoundsLabel">Old Wounds</label><i class="fas fa-angle-down" style="margin-top: -8px; font-size:14px; padding:5px"></i></td></tr>');

        for (let count = 0; count < woundlist.length; count++) {
            let wound = woundlist[count];
            let label = wound.treated == true ? '<label class="exhaustiontip">+1 Exh.</label>' : '';
            let treated = wound.treated == true ? 'checked' : '';

            if (wound.healed) {

                let datesInfo = "Gained: " + wound.gainedDate + " | Healed: " + wound.healedDate;

                let _wound = await html.find(".woundlist").append('<tr id="oldwoundtr"><td><input type="text" id="wounddes' + count + '" name="' + count + '" value="' + wound.location + '" disabled placeholder="Where is this wound?"></td><td style="color:grey;">Healed</td><td><input class="removewoundbutton" name="' + count + '" type="button" id="wound1"value=""><i class="fa-solid fa-x deleteWoundButton"></i></td><td><a title="' + datesInfo + '"><i class="fa-regular fa-square-info woundInformation"></a></i></td></th></tr>');

                html.find(".removewoundbutton[name='" + count + "']").on("click", async (ev) => {
                    ev.preventDefault();
                    // Handle the deletion event
                    let actor = game.actors.get(ev.currentTarget.closest(".woundlist").getAttribute("actorid"));
                    let _woundlist = actor.flags.darksheet.woundlist ? actor.flags.darksheet.woundlist : [];

                    // REMOVE WOUND
                    _woundlist.splice(ev.currentTarget.name, 1);
                    await actor.update({
                        'flags.darksheet.woundlist': woundlist
                    });
                    document.activeElement.blur();
                });
            }

        }
    } else {
        await html.find(".woundlist").append('<tr id="oldwounds" actorid="' + actor.id + '"><td colspan="4" class="oldWoundsColspan"><label class="oldWoundsLabel">Old Wounds</label><i class="fas fa-angle-up" style="margin-top: -8px; font-size:14px; padding:5px"></i></td></tr>');
    }
    html.find('#oldwounds').click((ev) => {
        ev.preventDefault();
        let actor = game.actors.get(ev.currentTarget.getAttribute("actorid"));
        actor.update({
            "flags.darksheet.displayOldWounds": !actor.flags.darksheet.displayOldWounds
        });
    });
    html.find('.addwoundbutton').click((ev) => {
        ev.preventDefault();
        let actor = game.actors.get(ev.currentTarget.getAttribute("actorid"));
        addWoundToCharacter(actor);
    });
    html.find('.rollHealWounds').click((ev) => {
        ev.preventDefault();
        let actor = game.actors.get(ev.currentTarget.getAttribute("actorid"));
        rollHealingWounds(actor);
    });
    html.find('.rollReopenWounds').click((ev) => {
        ev.preventDefault();
        let actor = game.actors.get(ev.currentTarget.getAttribute("actorid"));
        rollReopenWounds(actor);
    });
}
async function rollReopenWounds(actor) {
    let woundlist = actor.getFlag('darksheet', 'woundlist');

    let reopenedWounds = [];

    for (let i = 0; i < woundlist.length; i++) {
        let wound = woundlist[i];
        if (!wound.healed && wound.treated) {
            let roll = await new Roll("1d20").evaluate({
                async: true
            });
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
            let roll = await new Roll("1d20").evaluate({
                async: true
            });
            if (roll.total + actor.data.data.skills.med.total >= 15) {
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

async function addDarkSheetTab(app, html, data) {
    //ADD NEW DD TAB

    let test = html.find(".tabs").append('<a class="item control" data-group="primary" data-tab="dd" data-tooltip="Darker Dungeons" aria-label="Darker Dungeons"><i class="fas fa-skull"></i></a>');
    let sheet = html.find(".tab-body");
    let hideChecks = game.settings.get("darksheet", "hidechecks");
    data.hidechecks = hideChecks;
    let darkSheetTabHTML = await renderTemplate("modules/darksheet/templates/Tab_DD.html", data);
    await sheet.append(darkSheetTabHTML);

    // Set Training Tab as Active
    html.find('.tabs .item[data-tab="dd"]').click((ev) => {
        ev.preventDefault();
        app.activateDDTab = true;
    });

    // Unset Training Tab as Active
    html.find('.tabs .item:not(.tabs .item[data-tab="dd"])').click((ev) => {
        ev.preventDefault();
        app.activateDDTab = false;
    });
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
    //SPELL BURNOUT
    let spellFilters = html.find(".spellcasting-ability");
    let spellBurn = await renderTemplate("modules/darksheet/templates/spellburnout.html", data);
    spellFilters.append(spellBurn);
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

        const currentValue = encumbrance.find("div").find(".value")[0];
        currentValue.textContent = parseFloat(currentSlots).toFixed(1);;
        const maxValue = encumbrance.find("div").find(".max")[0];
        maxValue.textContent = maxSlots + " Slots";
        const multiplier = html.find(".encumbrance").find(".info").find(".multiplier").find(".value")[0];
        multiplier.textContent = "x" + Math.max(1, Math.min(actor.system.attributes.encumbrance.mod, 8));

        const size = html.find(".encumbrance").find(".info").find(".size");
        size.find(".value")[0].textContent = "+" + (maxSlots - STRBONUS);
        size.find(".label")[0].textContent = "Size-Slots";
        size.appendTo(size.parent());

        if(percentage <= 100)
            encumbrance[0].style = "--bar-percentage:" + Math.min(percentage, 100) + "%;";
        else
            encumbrance[0].style = "background: red;border: 2px solid red;--bar-percentage:" + Math.min(percentage, 100) + "%;";
        
        //SET BAR ARROWS
        //REMOVE FIRST 2 Arrows
        encumbrance[0].children[2].remove();
        encumbrance[0].children[2].remove();
        encumbrance[0].children[2].remove();
        encumbrance[0].children[1].remove();
    }

    let inventoryList = html[0].getElementsByClassName("inventory-list")[0];

    for (let i = 0; i < inventoryList.getElementsByClassName("items-header").length; i++) {

        //SET WEIGHT TO SLOTS
        if (game.settings.get('darksheet', 'slotbasedinventory'))
            inventoryList.getElementsByClassName("items-header")[i].getElementsByClassName("item-weight")[0].innerHTML = "Slots";
        let node = inventoryList.getElementsByClassName("items-header")[i].children[1];
        if (!game.settings.get('darksheet', 'hidenotches')) {
            //NOTCHES
            let notchesHeader = document.createElement("div");
            notchesHeader.classList.add("item-header", "item-weight", "item-notches");
            notchesHeader.innerHTML = 'Notches';
            inventoryList.getElementsByClassName("items-header")[i].insertBefore(notchesHeader, node);
        }
        //AMMODIE
        if (!game.settings.get('darksheet', 'hideammodie')) {
            let ammodieHeader = document.createElement("div");
            ammodieHeader.classList.add("item-header", "item-weight", "item-ammodie");
            ammodieHeader.innerHTML = 'Ammodie';
            inventoryList.getElementsByClassName("items-header")[i].insertBefore(ammodieHeader, node);
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
        if (_item.flags.darksheet == undefined || automaticFragility && _item.flags.darksheet.item.fragility == "" || automaticSlots && _item.flags.darksheet.item.slots == null) {
            //try find slot
            let slot = 1;
            let fragility = "";
            for (const [itemName, bulkValue] of Object.entries(itemBulk)) {

                if (_item.name.includes(itemName)) {
                    // Handle slot assignment based on automaticSlots setting
                    if (automaticSlots) {
                        let slot = bulkValue;
                        console.log(`Darksheet | ${_item.name} is assigned ${slot} slots.`);
                    }

                    // Check fragility based on automaticFragility setting
                    if (automaticFragility) {
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
            let itemData = _item.flags.darksheet.item;
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
                if (_item.flags.darksheet.item.temper) {
                    let temper = _item.flags.darksheet.item.temper;
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
                if (_item.flags.darksheet.item.quality) {
                    let quality = _item.flags.darksheet.item.quality;
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
    actor.updateEmbeddedDocuments('Item', updates).then(() => {
        console.log('Darksheet | Inventory updated successfully.');
    }).catch(error => {
        console.error('Darksheet | Failed to update inventory:', error);
    });

    //ADD LISTENERS
    html.find('.darksheet_AC').click(async (event) => {
        event.preventDefault();
        let ac = actor.system.attributes.ac.value;
        let roll1 = await new Roll("1d20").roll({
            async: true
        });
        let roll2 = await new Roll("1d20").roll({
            async: true
        });
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
        let roll = await new Roll("1d6").roll({
            async: true
        });
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
    html.find('.darksheetbuttonPlus').click(async (event) => {
        event.preventDefault();
        if (data.options.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | This token is not linked to the actor. Notch wasn't added.");
            return;
        }
        let item = data.actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId);
        await addNotchToItem(item);
        ui.notifications.notify("Added a notch to " + item.name);
    });
    html.find('.darksheetbuttonMinus').click(async (event) => {
        event.preventDefault();
        if (data.options.token?.actorLink === false) {
            ui.notifications.warn("Darksheet | This token is not linked to the actor. Notch wasn't removed.");
            return;
        }
        let item = data.actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId);
        await removeNotchFromItem(data.actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId));
        ui.notifications.notify("Removed a notch from " + item.name);
    });
    html.find('.randomnotch').click(async event => {
        event.preventDefault();
        let array = data.actor.items.filter(i => i.type !== "feat" && i.type !== "class" && i.type !== "spell");
        let numberino = 0;
        let randomItem = array[Math.floor(Math.random(numberino) * array.length)];
        let randomID = randomItem.id;
        let querysel = '[data-item-id="' + randomID + '"]';
        document.querySelectorAll(querysel)[0].getElementsByClassName("darksheetbuttonPlus")[0].click();
    });

}

async function rollAmmodie(event, actor) {
    let item = actor.items.find(i => i.id == event.target.closest(".item").dataset.itemId);
    let currentAmmodie = item.flags.darksheet.item.ammodie;
    let newAmmodie = currentAmmodie;
    let roll = await new Roll("1" + currentAmmodie).roll({
        async: true
    });
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

    let roll1 = await new Roll("1d" + burnoutDie).roll({
        async: true
    });
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
                    <div class="dnd5e chat-card item-card  ${customClass}" data-acor-id="${actor.id}">
                        <header class="card-header flexrow">
                            <i class="chatIcon ${icon}"></i>     
                            <div class="dice-roll red-dual darksheetRoll">
                                <h3 style="text-align-last: center;">${rollname}</h3>
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
        <div class="dnd5e chat-card item-card ${customClass}" data-acor-id="${actor.id}">
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
                    <h3 style="text-align: center;">${rollname}</h3>
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
    if (darksheet.flags.darksheet == null) {
        await darksheet.sheet.render(true);
        await darksheet.sheet.render(false);
    }
    let notches = darksheet.flags.darksheet.item?.notches ?? 0;

    let fragility = darksheet.flags.darksheet.item.fragility;
    let maxnotches = darksheet.flags.darksheet.item.maxnotches;
    let temper = darksheet.flags.darksheet.item.temper;
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
        } else if (notches >= parseInt(darksheet.flags.darksheet.item.fragility)) {

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
                <div class="dnd5e chat-card item-card">
                    <header class="card-header flexrow">
                        <img src="${actor.prototypeToken.texture.src}" title="" width="36" height="36" style="border: none;"/> <h3>${actor.name}'s </h3>
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
    let quality = darksheet.flags.darksheet.item.quality;
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
        if (darksheet.flags.darksheet.item.basearmor != null)
            newBaseAC = darksheet.flags.darksheet.item.basearmor;
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
        
            let baseweapondamage = darksheet.flags.darksheet.item.baseweapondamage;
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
    let basenotchdamage = darksheet.flags.darksheet.item?.basenotchdamage ?? "";
    let notches = darksheet.flags.darksheet.item?.notches ?? 0;
    let newnotches = Math.max(0, notches - 1); // Ensure newnotches doesn't go below 0

    if (darksheet.name.includes("[Shattered]")) {
        ui.notifications.warn("This item is [Shattered], you need to rename it first...");
        return;
    }

    // Update notches
    await darksheet.update({ 'flags.darksheet.item.notches': newnotches });

    if (darksheet.type === "equipment") {
        let AC = darksheet.system.armor.value ?? 0;
        let BaseAC = darksheet.flags.darksheet.item?.basearmor ?? AC;

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

        let baseweapondamage = darksheet.flags.darksheet.item?.baseweapondamage ?? { number: diceNumber, denomination: denomination };
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
    static darkScreenReload() {
        this._darkscreen.render(true);
        ui.notifications.notify("Reloaded Darkscreen");
    }
    static _darkscreen;
}


//DARKSCREEN
class Darkscreen {
    static addChatControl() {
        const chatControlLeft = document.getElementsByClassName("chat-control-icon")[0];
        let tableNode = document.getElementById("DarkScreen-button");

        if (chatControlLeft && !tableNode) {
            const chatControlLeftNode = chatControlLeft.firstElementChild;
            const number = 4;
            tableNode = document.createElement("label");
            tableNode.innerHTML = `<i id="DarkScreen-button" class="fas fa-book-dead DarkScreen-button" style="text-shadow: 0 0 1px black; color:white;" title="[Darkscreen] disabled until v0.9"></i>`;
            tableNode.onclick = Darkscreen.initializeDarkscreen;
            chatControlLeft.insertBefore(tableNode, chatControlLeftNode);
        }
    }
    static initializeDarkscreen() {
        if (this.dsc === undefined) {
            this.dsc = new DSC();
        }
        this.dsc.openDialog();

    }
}
Hooks.on('renderApplication', (app, html, options) => {
    if (app.title == "Darker Dungeons - Gamemaster Screen 2.0")
        Darksheet._darkscreen = app;
});
Hooks.on('closeApplication', (app, html, options) => {
    if (app.title == "Darker Dungeons - Gamemaster Screen 2.0")
        Darksheet._darkscreen = null;
});
Hooks.on('updateActor', (actor, updateData) => {
    if (Darksheet._darkscreen && Darksheet._darkscreen.rendered) {
        Darksheet._darkscreen.render(true);
    }
});

class DSC extends Application {
    constructor(options = {}) {
        super(options);
    }
    openDialog() {
        //LOAD TEMPLATE DATA
        let $dialog = $('.DSC-window');
        if ($dialog.length > 0) {
            $dialog.remove();
            return;
        }
        const templateData = {
            data: []
        };
        templateData.data = super.getData();
        templateData.title = "Darker Dungeons - Gamemaster Screen";

        if (game.world.flags.darksheet != undefined)
            templateData.data.screenData = game.world.flags.darksheet.darkscreen;
        //LOAD DATA

        const templatePath = "modules/darksheet/templates/darkscreen.html";
        DSC.renderMenu(templatePath, templateData);

    }
    static renderMenu(path, data) {
        const dialogOptions = {
            width: 1200,
            heigth: 1200,
            classes: ['DSC-window resizable']
        };
        dialogOptions.resizable = true;
        renderTemplate(path, data).then(dlg => {
            new Dialog({
                title: game.i18n.localize('Darker Dungeons - Gamemaster Screen 2.0'),
                content: dlg,
                buttons: {}
            }, dialogOptions).render(true);
        });
    }
}
Hooks.on('canvasReady', function() {
    if (game.user.isGM) {
        Darkscreen.addChatControl();

        //ADD FLAGS IF NEEDED
        if (game.world.flags.darksheet == undefined) {
            game.world.flags.darksheet = {};
        }
        if (game.world.flags.darksheet.darkscreen == undefined) {
            game.world.flags.darksheet.darkscreen = {};
        }
        if (game.world.flags.darksheet.darkscreen.lastpage == undefined) {
            game.world.flags.darksheet.darkscreen.lastpage = "party"
        }
    }
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