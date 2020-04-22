import {
    ActorSheet5eCharacter
} from '../../../../modules/darksheet/actor/sheets/character.js';

//Load Templates
Hooks.once('init', () => loadTemplates([
    'modules/darksheet/templates/actors/parts/actor-inventory.html',
    'modules/darksheet/templates/actors/parts/actor-spellbook.html',
    'modules/darksheet/templates/items/parts/item-description.html'
]));

//Register Sheet
Hooks.once('init', function() {
    Actors.registerSheet('dnd5e', DarkSheet, {
        types: ['character']
    });
    Items.registerSheet('dnd5e', DarkItemSheet5e);
    game.settings.register('darksheet', 'slotbasedinventory', {
        name: 'Slot based inventory',
        hint: 'This option determines on which value the bar at the bottom of the inventory uses, if his is enabled it will use slots instead of weight.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hidesettings', {
        name: 'Hide Settings from player character sheet',
        hint: 'This option hides the settings section from all character sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hidechecks', {
        name: 'Hide "Checks"-Section from player Character sheet',
        hint: 'This option hides the checks section from all character sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'noheropoints', {
        name: 'NO Hero-Points',
        hint: 'Disables the use of Heropoints',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    console.log("Darker Dungeons | Initializing Darker Dungeons for the D&D 5th Edition System\n", "_____________________________________________________________________________________________\n", "  ____                _                 ____                                                \n", " |  _ \\   __ _  _ __ | | __ ___  _ __  |  _ \\  _   _  _ __    __ _   ___   ___   _ __   ___ \n", " | | | | / _` || '__|| |/ // _ \| '__|  | | | || | | || '_ \\  / _` | / _ \\ / _ \\ | '_ \\ / __| \n", " | |_| || (_| || |   |   <|  __/| |    | |_| || |_| || | | || (_| ||  __/| (_) || | | |\\__ \\ \n", " |____/  \\__,_||_|   |_|\\_\\\\___||_|    |____/  \\__,_||_| |_| \\__, | \\___| \\___/ |_| |_||___/ \n", "                                                             |___/                          \n", "_____________________________________________________________________________________________");
});
//on Update Actor check for status
Hooks.on('updateActor', (actor, updates, options, userId) => {
    const test = "Actor Updated";
    console.log(test);
	
    if (updates.data && updates.data.status) {

        const blinded = "modules/combat-utility-belt/icons/blinded.svg";
        const charmed = "modules/combat-utility-belt/icons/charmed.svg";
        const deafened = "modules/combat-utility-belt/icons/deafened.svg";
        const dying = "icons/svg/skull.svg";
        const frightened = "modules/combat-utility-belt/icons/frightened.svg";
        const grappled = "modules/combat-utility-belt/icons/grappled.svg";
        const incapacitated = "modules/combat-utility-belt/icons/incapacitated.svg";
        const invisible = "modules/combat-utility-belt/icons/invisible.svg";
        const paralyzed = "modules/combat-utility-belt/icons/paralyzed.svg";
        const petrified = "modules/combat-utility-belt/icons/petrified.svg";
        const poisoned = "modules/combat-utility-belt/icons/poisoned.svg";
        const prone = "modules/combat-utility-belt/icons/prone.svg";
        const restraint = "modules/combat-utility-belt/icons/restraint.svg";
        const stunned = "modules/combat-utility-belt/icons/stunned.svg";
        const unconscious = "modules/combat-utility-belt/icons/unconscious.svg";
        const concentrating = "modules/combat-utility-belt/icons/concentrating.svg";

		const exhaustion1 = "modules/combat-utility-belt/icons/exhaustion1.svg";
		const exhaustion2 = "modules/combat-utility-belt/icons/exhaustion2.svg";
		const exhaustion3 = "modules/combat-utility-belt/icons/exhaustion3.svg";
		const exhaustion4 = "modules/combat-utility-belt/icons/exhaustion4.svg";
		const exhaustion5 = "modules/combat-utility-belt/icons/exhaustion5.svg";

        const actorData = actor.data;
        actor.getActiveTokens().forEach(async (t) => {
            if (t.data.actorLink && t.scene.id === game.scenes.active.id) {
                if (actorData.data.status.isBlinded && !t.data.effects.includes(blinded)) t.toggleEffect(blinded);
                if (!actorData.data.status.isBlinded && t.data.effects.includes(blinded)) t.toggleEffect(blinded);

                if (actorData.data.status.isCharmed && !t.data.effects.includes(charmed)) await t.toggleEffect(charmed);
                if (!actorData.data.status.isCharmed && t.data.effects.includes(charmed)) await t.toggleEffect(charmed);

                if (actorData.data.status.isDeafened && !t.data.effects.includes(deafened)) await t.toggleEffect(deafened);
                if (!actorData.data.status.isDeafened && t.data.effects.includes(deafened)) await t.toggleEffect(deafened);

                if (actorData.data.status.isDying && !t.data.effects.includes(dying)) await t.toggleEffect(dying);
                if (!actorData.data.status.isDying && t.data.effects.includes(dying)) await t.toggleEffect(dying);

                if (actorData.data.status.isFrightened && !t.data.effects.includes(frightened)) await t.toggleEffect(frightened);
                if (!actorData.data.status.isFrightened && t.data.effects.includes(frightened)) await t.toggleEffect(frightened);

                if (actorData.data.status.isGrappled && !t.data.effects.includes(grappled)) await t.toggleEffect(grappled);
                if (!actorData.data.status.isGrappled && t.data.effects.includes(grappled)) await t.toggleEffect(grappled);

                if (actorData.data.status.isIncapacitated && !t.data.effects.includes(incapacitated)) await t.toggleEffect(incapacitated);
                if (!actorData.data.status.isIncapacitated && t.data.effects.includes(incapacitated)) await t.toggleEffect(incapacitated);

                if (actorData.data.status.isInvisible && !t.data.effects.includes(invisible)) await t.toggleEffect(invisible);
                if (!actorData.data.status.isInvisible && t.data.effects.includes(invisible)) await t.toggleEffect(invisible);

                if (actorData.data.status.isParalyzed && !t.data.effects.includes(paralyzed)) await t.toggleEffect(paralyzed);
                if (!actorData.data.status.isParalyzed && t.data.effects.includes(paralyzed)) await t.toggleEffect(paralyzed);

                if (actorData.data.status.isPetrified && !t.data.effects.includes(petrified)) await t.toggleEffect(petrified);
                if (!actorData.data.status.isPetrified && t.data.effects.includes(petrified)) await t.toggleEffect(petrified);

                if (actorData.data.status.isPoisoned && !t.data.effects.includes(poisoned)) await t.toggleEffect(poisoned);
                if (!actorData.data.status.isPoisoned && t.data.effects.includes(poisoned)) await t.toggleEffect(poisoned);

                if (actorData.data.status.isProne && !t.data.effects.includes(prone)) await t.toggleEffect(prone);
                if (!actorData.data.status.isProne && t.data.effects.includes(prone)) await t.toggleEffect(prone);

                if (actorData.data.status.isRestrained && !t.data.effects.includes(restraint)) await t.toggleEffect(restraint);
                if (!actorData.data.status.isRestrained && t.data.effects.includes(restraint)) await t.toggleEffect(restraint);

                if (actorData.data.status.isStunned && !t.data.effects.includes(stunned)) await t.toggleEffect(stunned);
                if (!actorData.data.status.isStunned && t.data.effects.includes(stunned)) await t.toggleEffect(stunned);

                if (actorData.data.status.isUnconscious && !t.data.effects.includes(unconscious)) await t.toggleEffect(unconscious);
                if (!actorData.data.status.isUnconscious && t.data.effects.includes(unconscious)) await t.toggleEffect(unconscious);

                if (actorData.data.status.isConcentrating && !t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);
                if (!actorData.data.status.isConcentrating && t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);
				
				if (actorData.data.status.isConcentrating && !t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);
                if (!actorData.data.status.isConcentrating && t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);
				
				//EXHAUSTION STATUS
				if(actorData.data.attributes.newexhaustion === 1) await t.toggleEffect(exhaustion1);
                await t.drawEffects();
            }
        });
    }
});

//Check for preUpdateToken
Hooks.on('preUpdateToken', async (scene, sceneId, updates, tokenData) => {
    // if the update has no effects, return
    if (!updates.effects) return;
    if (!tokenData.currentData.actorLink) return;
    const tokenActor = game.actors.entities.find(a => a.id == tokenData.currentData.actorId);
    if (!tokenActor) return;

    const blinded = "modules/combat-utility-belt/icons/blinded.svg";
    const charmed = "modules/combat-utility-belt/icons/charmed.svg";
    const deafened = "modules/combat-utility-belt/icons/deafened.svg";
    const dying = "icons/svg/skull.svg";
    const frightened = "modules/combat-utility-belt/icons/frightened.svg";
    const grappled = "modules/combat-utility-belt/icons/grappled.svg";
    const incapacitated = "modules/combat-utility-belt/icons/incapacitated.svg";
    const invisible = "modules/combat-utility-belt/icons/invisible.svg";
    const paralyzed = "modules/combat-utility-belt/icons/paralyzed.svg";
    const petrified = "modules/combat-utility-belt/icons/petrified.svg";
    const poisoned = "modules/combat-utility-belt/icons/poisoned.svg";
    const prone = "modules/combat-utility-belt/icons/prone.svg";
    const restraint = "modules/combat-utility-belt/icons/restraint.svg";
    const stunned = "modules/combat-utility-belt/icons/stunned.svg";
    const unconscious = "modules/combat-utility-belt/icons/unconscious.svg";
    const concentrating = "modules/combat-utility-belt/icons/concentrating.svg";
	
    const exhaustion1 = "modules/combat-utility-belt/icons/exhaustion1.svg";
    const exhaustion2 = "modules/combat-utility-belt/icons/exhaustion2.svg";
    const exhaustion3 = "modules/combat-utility-belt/icons/exhaustion3.svg";
    const exhaustion4 = "modules/combat-utility-belt/icons/exhaustion4.svg";
    const exhaustion5 = "modules/combat-utility-belt/icons/exhaustion5.svg";

    await tokenActor.update({
        "data.status.isBlinded": updates.effects.includes(blinded)
    });
    await tokenActor.update({
        "data.status.isDeafened": updates.effects.includes(deafened)
    });
    await tokenActor.update({
        "data.status.isDying": updates.effects.includes(dying)
    });
    await tokenActor.update({
        "data.status.isFrightened": updates.effects.includes(frightened)
    });
    await tokenActor.update({
        "data.status.isGrappled": updates.effects.includes(grappled)
    });
    await tokenActor.update({
        "data.status.isIncapacitated": updates.effects.includes(incapacitated)
    });
    await tokenActor.update({
        "data.status.isInvisible": updates.effects.includes(invisible)
    });
    await tokenActor.update({
        "data.status.isParalyzed": updates.effects.includes(paralyzed)
    });
    await tokenActor.update({
        "data.status.isPetrified": updates.effects.includes(petrified)
    });
    await tokenActor.update({
        "data.status.isPoisoned": updates.effects.includes(poisoned)
    });
    await tokenActor.update({
        "data.status.isProne": updates.effects.includes(prone)
    });
    await tokenActor.update({
        "data.status.isRestrained": updates.effects.includes(restraint)
    });
    await tokenActor.update({
        "data.status.isStunned": updates.effects.includes(stunned)
    });
    await tokenActor.update({
        "data.status.isUnconscious": updates.effects.includes(unconscious)
    });
    await tokenActor.update({
        "data.status.isConcentrating": updates.effects.includes(concentrating)
    });
    await tokenActor.update({
        "data.status.isExhaustion1": updates.effects.includes(exhaustion1)
    });
});

Hooks.on('createToken', async (scene, sceneId, tokenData, options, userId) => {
    //if the token has no linked actor, return
    if (!tokenData.actorLink) return;

    const actor = game.actors.entities.find(a => a.id == tokenData.actorId);

    // If this token has no actor, return
    if (!actor) return;

    const blinded = "modules/combat-utility-belt/icons/blinded.svg";
    const charmed = "modules/combat-utility-belt/icons/charmed.svg";
    const deafened = "modules/combat-utility-belt/icons/deafened.svg";
    const dying = "icons/svg/skull.svg";
    const frightened = "modules/combat-utility-belt/icons/frightened.svg";
    const grappled = "modules/combat-utility-belt/icons/grappled.svg";
    const incapacitated = "modules/combat-utility-belt/icons/incapacitated.svg";
    const invisible = "modules/combat-utility-belt/icons/invisible.svg";
    const paralyzed = "modules/combat-utility-belt/icons/paralyzed.svg";
    const petrified = "modules/combat-utility-belt/icons/petrified.svg";
    const poisoned = "modules/combat-utility-belt/icons/poisoned.svg";
    const prone = "modules/combat-utility-belt/icons/prone.svg";
    const restraint = "modules/combat-utility-belt/icons/restraint.svg";
    const stunned = "modules/combat-utility-belt/icons/stunned.svg";
    const unconscious = "modules/combat-utility-belt/icons/unconscious.svg";
    const concentrating = "modules/combat-utility-belt/icons/concentrating.svg";

	const exhaustion1 = "modules/combat-utility-belt/icons/exhaustion1.svg";
    const exhaustion2 = "modules/combat-utility-belt/icons/exhaustion2.svg";
    const exhaustion3 = "modules/combat-utility-belt/icons/exhaustion3.svg";
    const exhaustion4 = "modules/combat-utility-belt/icons/exhaustion4.svg";
    const exhaustion5 = "modules/combat-utility-belt/icons/exhaustion5.svg";
	
    const actorData = actor.data;
    actor.getActiveTokens().forEach(async (t) => {
        if (t.data.actorLink && t.scene.id === game.scenes.active.id) {
            if (actorData.data.status.isBlinded) await t.toggleEffect(blinded);

            if (actorData.data.status.isCharmed) await t.toggleEffect(charmed);

            if (actorData.data.status.isDeafened) await t.toggleEffect(deafened);

            if (actorData.data.status.isDying) await t.toggleEffect(dying);

            if (actorData.data.status.isFrightened) await t.toggleEffect(frightened);

            if (actorData.data.status.isGrappled) await t.toggleEffect(grappled);

            if (actorData.data.status.isIncapacitated) await t.toggleEffect(incapacitated);

            if (actorData.data.status.isInvisible) await t.toggleEffect(invisible);

            if (actorData.data.status.isParalyzed) await t.toggleEffect(paralyzed);

            if (actorData.data.status.isPetrified) await t.toggleEffect(petrified);

            if (actorData.data.status.isPoisoned) await t.toggleEffect(poisoned);

            if (actorData.data.status.isProne) await t.toggleEffect(prone);

            if (actorData.data.status.isRestrained) await t.toggleEffect(restraint);

            if (actorData.data.status.isStunned) await t.toggleEffect(stunned);

            if (actorData.data.status.isUnconscious) await t.toggleEffect(unconscious);

            if (actorData.data.status.isConcentrating) await t.toggleEffect(concentrating);

            if (actorData.data.attributes.newexhaustion === 1) await t.toggleEffect(exhaustion1);
            await t.drawEffects();
        }
    });
});

export const _getInitiativeFormula = function(combatant) {
    const actor = combatant.actor;
    if (!actor) return "1d20";
    const init = actor.data.data.attributes.init;
    const parts = ["1d20", init.mod, (init.prof !== 0) ? init.prof : null, (init.bonus !== 0) ? init.bonus : null];
    if (actor.getFlag("dnd5e", "initiativeAdv")) parts[0] = "2d20kh";
    if (CONFIG.initiative.tiebreaker) parts.push(actor.data.data.abilities.int.value / 100);
    return parts.filter(p => p !== null).join(" + ");
};
/**
 * Override and extend the core ItemSheet implementation to handle D&D5E specific item types
 * @type {ItemSheet}
 */
export class DarkItemSheet5e extends ItemSheet {
	static get defaultOptions() {
	  return mergeObject(super.defaultOptions, {
		width: 560,
		height: 420,
		classes: ["dnd5e", "sheet", "item"],
		resizable: false,
		scrollY: [".tab.details"],
		tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "description"}]
		});
	}
    /**
     * Return a dynamic reference to the HTML template path used to render this Item Sheet
     * @return {string}
     */
    get template() {
        const path = "modules/darksheet/templates/items/";
        return `${path}/${this.item.data.type}.html`;
    } /* -------------------------------------------- */ /* -------------------------------------------- */

    /**
     * Prepare item sheet data
     * Start with the base item data and extending with additional properties for rendering.
     */
    getData() {
		const data = super.getData();
		data.labels = this.item.labels;
		
		// Include CONFIG values
		data.config = CONFIG.DND5E;

		// Item Type, Status, and Details
		data.itemType = data.item.type.titleCase();
		data.itemStatus = this._getItemStatus(data.item);
		data.itemProperties = this._getItemProperties(data.item);
		data.isPhysical = data.item.data.hasOwnProperty("quantity");

		// Action Details
		data.hasAttackRoll = this.item.hasAttack;
		data.isHealing = data.item.data.actionType === "heal";
		data.isFlatDC = getProperty(data.item.data, "save.scaling") === "flat";	
		return data;
	}
    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
    _getItemStatus(item) {
        if (item.type === "spell") return item.data.preparation.prepared ? "Prepared" : "Unprepared";
        else if (["weapon", "equipment"].includes(item.type)) return item.data.equipped ? "Equipped" : "Unequipped";
        else if (item.type === "tool") return item.data.proficient ? "Proficient" : "Not Proficient";
    } /* -------------------------------------------- */
    /**
     * Get the Array of item properties which are used in the small sidebar of the description tab
     * @return {Array}
     * @private
     */
    _getItemProperties(item) {
        const props = [];
        const labels = this.item.labels;
        if (item.type === "weapon") {
            props.push(...Object.entries(item.data.properties)
                .filter(e => e[1] === true)
                .map(e => CONFIG.DND5E.weaponProperties[e[0]]));
        } else if (item.type === "spell") {
            props.push(
                labels.components,
                labels.materials,
                item.data.components.concentration ? "Concentration" : null,
                item.data.components.ritual ? "Ritual" : null
            )
        } else if (item.type === "equipment") {
            props.push(CONFIG.DND5E.equipmentTypes[item.data.armor.type]);
            props.push(labels.armor);
        } else if (item.type === "feat") {
            props.push(labels.featType);
        } // Action type
        if (item.data.actionType) {
            props.push(CONFIG.DND5E.itemActionTypes[item.data.actionType]);
        } // Action usage
        if ((item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation)) {
            props.push(
                labels.activation,
                labels.range,
                labels.target,
                labels.duration
            )
        }
        return props.filter(p => !!p);
    } /* -------------------------------------------- */

    /*  Form Submission                             */
    /* -------------------------------------------- */
    /**
     * Extend the parent class _updateObject method to ensure that damage ends up in an Array
     * @private
     */
    _updateObject(event, formData) { // Handle Damage Array
        let damage = Object.entries(formData).filter(e => e[0].startsWith("data.damage.parts"));
        formData["data.damage.parts"] = damage.reduce((arr, entry) => {
            let [i, j] = entry[0].split(".").slice(3);
            if (!arr[i]) arr[i] = [];
            arr[i][j] = entry[1];
            return arr;
        }, []); // Update the Item
        super._updateObject(event, formData);
    } /* -------------------------------------------- */
    /**
     * Activate listeners for interactive item sheet events
     */
    activateListeners(html) {
        super.activateListeners(html); // Activate tabs
        // Save scroll position

        html.find(".damage-control").click(this._onDamageControl.bind(this));
    }

    /* -------------------------------------------- */
    /**
     * Add or remove a damage part from the damage formula
     * @param {Event} event     The original click event
     * @return {Promise}
     * @private
     */
    async _onDamageControl(event) {
        event.preventDefault();
        const a = event.currentTarget;

        // Add new damage component
        if (a.classList.contains("add-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const damage = this.item.data.data.damage;
            return this.item.update({
                "data.damage.parts": damage.parts.concat([
                    ["", ""]
                ])
            });
        } // Remove a damage component
        if (a.classList.contains("delete-damage")) {
            await this._onSubmit(event); // Submit any unsaved changes
            const li = a.closest(".damage-part");
            const damage = duplicate(this.item.data.data.damage);
            damage.parts.splice(Number(li.dataset.damagePart), 1);
            return this.item.update({
                "data.damage.parts": damage.parts
            });
        }
    }
}
export class DarkSheet extends ActorSheet5eCharacter {
    get template() {
        return 'modules/darksheet/templates/character-sheet.html';
    }
	getData() {
		const data = super.getData();
		//settings
		data.noheropoints = game.settings.get('darksheet', 'noheropoints');//
		data.slotbasedinventory = game.settings.get('darksheet', 'slotbasedinventory');//
		data.hidesettings = game.settings.get('darksheet', 'hidesettings');//
		data.hidechecks = game.settings.get('darksheet', 'hidechecks');//

		return data;
	}
    activateListeners(html) {
        super.activateListeners(html);
        html.find('.exhaustioncalc').click(event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustionpoints.value;
            //Temperature Exhaustion
            if (temp === "exenegised") {
                newexhaustion += -1;
            } else if (temp === "exvsleepy" || temp === "exbarely") {
                newexhaustion += 1;
            }
            //Food Exhaustion
            if (food === "foodstuffed") {
                newexhaustion += -1;
            } else if (food === "foodravenous" || food === "foodstarving") {
                newexhaustion += 1;
            }
            //Water Exhaustion
            if (water === "wquenched") {
                newexhaustion += -1;
            } else if (water === "wdry" || water === "wdehydrated") {
                newexhaustion += 1;
            }
            //Fatigue Exhaustion
            if (fatigue === "exenegised") {
                newexhaustion += -1;
            } else if (fatigue === "exvsleepy" || fatigue === "exbarely") {
                newexhaustion += 1;
            }
            //exhaustion over 3?
            if (newexhaustion >= 4) {
                console.log("(DarkSheet): Maximum exhaustion achieved through needs. Total exhaustion from fron needs cannot exceed 3");
                newexhaustion = 3;
            }
            //adding manual exhaustion
            newexhaustion = (newexhaustion * 1 + manualexhaustion * 1);
            //exhaustion <0?
            if (newexhaustion <= 0) {
                newexhaustion = 0;
            }
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
			this.actor.update({'data.attributes.newexhaustion': newexhaustion});
            this.render();
        });

        /*RICH TEXT EDITOR CUSTOM CSS*/
        window.createEditor = (function() {
            const cached = window.createEditor;
            return function() {
                arguments[0].content_css = 'css/mce.css,modules/darksheet/css/darksheet-mce.css';
                return cached.apply(this, arguments);
            };
        })();
        /*END RICH TEXT EDITOR CUSTOM CSS END*/
        /*LOOK FOR AMMODIE*/
        html.find('.darksheetbuttonplus').click(event => {
		    event.preventDefault();
				const itemID = event.currentTarget.closest('.item').dataset.itemId;
				let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
				let notches = darkitem.flags.darksheet.item.notches;
				let basenotchdamage;
				notches ++;
				
				//VALUE CALCULATION==========================================
				let quality = darkitem.flags.darksheet.item.quality;
				if(notches >= 4){
					quality = "scarred";
				}
				else if(notches >= 2 && quality === "worn"){
					quality = "well-worn";
				}
				else if(notches >= 1 && quality === "pristine"){
					quality = "worn";
				}
				this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'flags.darksheet.item.quality': quality});
				
				if (darkitem.type === "equipment"){//ARMOR CALCULATION==========================================
					let AC = darkitem.data.armor.value;
					let newAC = AC - 1;
					if(newAC <= 0){newAC = 0};
					if(notches === 1){
					 basenotchdamage = AC;
					}
					if(newAC >= basenotchdamage){newAC = basenotchdamage}
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.armor.value': newAC});
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.basenotchdamage': basenotchdamage});

					
				}
				if (darkitem.type === "weapon"){//WEAPON CALCULATION==========================================
					let updatedamage;
					//DAMAGE CALCULATION PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
					
					let damage1 = darkitem.data.damage.parts[0][0];
		//			console.log(damage1);
					let dicenumber = damage1.charAt(0); //2
					let d = damage1.charAt(1); //d 
					let damage = damage1.charAt(2) + damage1.charAt(3); //6
					let mod = " + @mod";
					
					let weapondamage;
					if(darkitem.data.damage.currentweapondamage)
					{
						weapondamage = darkitem.data.damage.currentweapondamage;
					}
					else{
						weapondamage = dicenumber+d+damage; //"2d6 "
					}
		//			console.log("Darksheet-Dev:" + dicenumber, d, damage);
		//			console.log("Darksheet-Dev:" +weapondamage);

					let baseweapondamage = darkitem.data.damage.baseweapondamage;
					if(darkitem.data.damage.baseweapondamage === undefined){
						baseweapondamage = weapondamage;
						this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.baseweapondamage': baseweapondamage});
					}
					
					//WEAPONDAMAGE  PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
					switch(weapondamage) {
					//CASES FOR 2 DAMAGE DICE
					  case "2d20 ":weapondamage = "1d20 + 1d12 ";break;
					  case "1d20 + 1d12 ":weapondamage = "2d12 ";break;
					  case "2d12 ":weapondamage = "1d12 + 1d10 ";break;
					  case "1d12 + 1d10 ":weapondamage = "2d10 ";break;
					  case "2d10 ":weapondamage = "1d10 + 1d6 ";break;
					  case "1d10 + 1d6 ":weapondamage = "2d6 ";break;
					  case "2d6 ":weapondamage = "1d6 + 1d4 ";break;
					  case "1d6 + 1d4 ":weapondamage = "2d4 ";break;
					  case "2d4 ":weapondamage = "1d4 + 1 ";break;
					  case "1d4 + 1 ":
						  weapondamage = "2 ";
						  basenotchdamage = notches;
					  break;
					//CASES FOR single dice damage
					  case "1d20 ":weapondamage = "1d12 ";break;
					  case "1d12 ":weapondamage = "1d10 ";break;
					  case "1d10 ":weapondamage = "1d8 ";break;
					  case "1d8 ":weapondamage = "1d6 ";break;
					  case "1d6 ":weapondamage = "1d4 ";break;
					  case "1d4 ":
						  weapondamage = "1 ";
						  basenotchdamage = notches;
					  break;
					  default:
						// code block
					}
						updatedamage = weapondamage+mod;
						const parts = duplicate(darkitem.data.damage.parts);
						parts[0][0] = updatedamage;
						this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.parts': parts});
						this.render();
					
					//UPDATE WEAPON DAMAGE ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.currentweapondamage': weapondamage});
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.basenotchdamage': basenotchdamage});

				}
				this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'flags.darksheet.item.notches': notches});
				this.render();
		});
        html.find('.darksheetbutton-').click(event => { 
		    event.preventDefault();
				const itemID = event.currentTarget.closest('.item').dataset.itemId;
				let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
				let basenotchdamage = darkitem.data.damage.basenotchdamage;
				let notches = darkitem.flags.darksheet.item.notches;
				let newnotches = notches - 1;
				let updatedamage;
				if(notches === undefined){newnotches = "";}
				if(newnotches <= 0){newnotches = "";}
				this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'flags.darksheet.item.notches': newnotches});
				if (darkitem.type === "equipment"){//ARMOR CALCULATION==========================================
					let AC = darkitem.data.armor.value;
					let newAC = AC;
					if(notches > basenotchdamage){ //IF NOTCHES AREN'T SMALLER THAN THE BASENOTCHES
					}
					else{newAC ++;}
					if(newAC >= basenotchdamage){newAC = basenotchdamage}
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.armor.value': newAC});
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.basenotchdamage': basenotchdamage});
				}
				//DAMAGE CALCULATION MINUS-------------------------------------------------------------------
				if (darkitem.type === "weapon"){
					let damage1 = darkitem.data.damage.parts[0][0];
		//			console.log(damage1);
					let dicenumber = damage1.charAt(0); //2
					let d = damage1.charAt(1); //d 
					let damage = damage1.charAt(2) + damage1.charAt(3); //6
					let mod = " + @mod";
					let weapondamage;
					if(darkitem.data.damage.currentweapondamage)
					{
					weapondamage = darkitem.data.damage.currentweapondamage;
					}
					else{
					weapondamage = dicenumber+d+damage; //"2d6 "
					}
		//			console.log("Darksheet-Dev:" + dicenumber, d, damage);
		//			console.log("Darksheet-Dev:" +weapondamage);

					let baseweapondamage = darkitem.data.damage.baseweapondamage;
					if(darkitem.data.damage.baseweapondamage === undefined){
						baseweapondamage = weapondamage;
						this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.baseweapondamage': baseweapondamage});
					}
					
					if(weapondamage === baseweapondamage){
					weapondamage = baseweapondamage;
					}
					else if(notches > basenotchdamage){ //IF NOTCHES AREN'T SMALLER THAN THE BASENOTCHES
					}
					else{
					switch(weapondamage) {
						//CASES FOR 2 DAMAGE DICE
						  case "2 ":weapondamage = "1d4 + 1 ";break;
						  case "1d4 + 1 ":weapondamage = "2d4 ";break;
						  case "2d4 ":weapondamage = "1d6 + 1d4 ";break;
						  case "1d6 + 1d4 ":weapondamage = "2d6 ";break;
						  case "2d6 ":weapondamage = "1d8 + 1d6 ";break;
						  case "1d8 + 1d6 ":weapondamage = "2d8 ";break;
						  case "2d8 ":weapondamage = "1d10 + 1d8 ";break;
						  case "1d10 + 1d8 ":weapondamage = "2d10 ";break;
						  case "2d10 ":weapondamage = "1d12 + 1d10 ";break;
						  case "1d12 + 1d10 ":weapondamage = "2d12 ";break;
						  case "2d12 ":weapondamage = "1d20 + 1d12 ";break;
						  case "1d20 + 1d12":weapondamage = "2d20";break;
						//CASES FOR SINGLE DAMAGEDICE
						  case "1 ":weapondamage = "1d4 ";break;
						  case "1d4 ":weapondamage = "1d6 ";break;
						  case "1d6 ":weapondamage = "1d8 ";break;
						  case "1d8 ":weapondamage = "1d10 ";break;
						  case "1d10 ":weapondamage = "1d12 ";break;
						  case "1d12 ":weapondamage = "1d20 ";break;
						  default:
							// code block
						}
					}
					updatedamage = weapondamage+mod;
					const parts = duplicate(darkitem.data.damage.parts);
					parts[0][0] = updatedamage;
					if(newnotches <= 0){basenotchdamage = "";}
					//NOTCH CALCULATION MINUS-------------------------------------------------------------------
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.basenotchdamage': basenotchdamage});
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.parts': parts});
					this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'data.damage.currentweapondamage': weapondamage}); //Weapon Damage On Name
				}
				this.render();
		});
		html.find('.ammodice').click(event => {
            event.preventDefault(); // Rolling table, from best to worst
            const rollings = ['d12', 'd10', 'd8', 'd6', 'd4', 'd2', '1', '']; // Getting item
            let item = this.actor.getOwnedItem(Number($(event.currentTarget).parents('[data-item-id]').attr("data-item-id")));
            // Seeting and creating chatMessage
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
            let title = `<header><h3>${this.actor.data.name} rolls ${this.actor.data.data.attributes.adress} ammodice for ${darkitem.name}<h3></header>`;
            let roll = new Roll('@ammodie', {
                ammodie: darkitem.flags.darksheet.item.ammodie
            }).roll();
            let rollMode = game.settings.get("core", "rollMode");
            let currentdie = darkitem.flags.darksheet.item.ammodie;
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({
                    actor: this
                }),
                flavor: title,
                rollMode: rollMode
            }); // If Epic fail
			let newammodie;
            if (roll.result === "1" || roll.result === "2") {
                if (currentdie === "d20") {
                    newammodie = "d12";
                } else if (currentdie === "d12") {
                    newammodie = "d10";
                } else if (currentdie === "d10") {
                    newammodie = "d8";
                } else if (currentdie === "d8") {
                    newammodie = "d6";
                } else if (currentdie === "d6") {
                    newammodie = "d4";
                } else if (currentdie === "d4") {
                    newammodie = "1";
                } else {
                    newammodie = "";
                }
				this.actor.updateEmbeddedEntity('OwnedItem', {_id: darkitem._id, 'flags.darksheet.item.ammodie': newammodie});
                this.render();
            }
        });
        /*LOOK FOR Stresscheckbox*/
        html.find('.stressroll').click(event => {
            event.preventDefault();

            // Rolling table, from best to worst
            let table = game.tables.entities.find(t => t.data.name === "Afflictions");
            table.draw()
        });

        /*LOOK FOR BURNOUTDIE*/
        html.find('.burnoutdie').click(event => {
            event.preventDefault();

            // Rolling table, from best to worst
            const rollings = ['12', '10', '8', '6', '4'];
            // Value of the burnoutdice
            let burnoutdie = this.actor.data.data.attributes.burnout.value;
            // find the table
            let table = game.tables.entities.find(t => t.data.name === "Burnout Consequence");
            // burnoutsettings
            let bsettings = this.actor.data.data.attributes.burnoutc.value
            // magic region
            var regionmod = parseInt(this.actor.data.data.attributes.regionmod.value, 10);
            //console.log("Regionmod: "+regionmod);
            // burnoutdice changed through region
            if (regionmod < 0) {
                var regionmodz = rollings.indexOf(this.actor.data.data.attributes.burnout.value) - parseInt(regionmod);
                //console.log("Regionmodz step2 kleiner: "+regionmodz);
                if (regionmodz >= 5) {
                    regionmodz = 4;
                }
            } else {
                var regionmodz = rollings.indexOf(this.actor.data.data.attributes.burnout.value) - parseInt(regionmod);
                //console.log("Regionmodz step3 größer: "+regionmodz);
                if (regionmodz <= 0) {
                    regionmodz = 0;
                }
            }
            var burnoutARegion = rollings[regionmodz];
            let rollcon = burnoutARegion;
            let rollcona = "d" + rollcon
            let roll = new Roll(`${rollcona}`).roll();
            const result = table.roll()



            if (burnoutdie === 0) {} else {
                let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3>${roll.result}</h3>
					</header>
				</div>`;
                let content2 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px;">${roll.result}</h3>
					</header>
					</br>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px; text-align: center;">${result[1].text}</h3>
				</div>`;
                let content3 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px;">${roll.result}</h3>
					</header>
				</div>`;
                let rollWhisper = null;
                let rollBlind = false;
                let rollMode = game.settings.get("core", "rollMode");
                if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
                if (rollMode === "blindroll") rollBlind = true;
                if (roll.result <= 2) {
                    if (bsettings) {
                        ChatMessage.create({
                            user: game.user._id,
                            content: content2,
                            speaker: {
                                actor: this.actor._id,
                                token: this.actor.token,
                                alias: this.actor.name
                            },

                            sound: CONFIG.sounds.dice,
                            flags: {
                                darksheet: {
                                    outcome: 'bad'
                                }
                            }
                        });
                    } else {
                        ChatMessage.create({
                            user: game.user._id,
                            content: content3,
                            speaker: {
                                actor: this.actor._id,
                                token: this.actor.token,
                                alias: this.actor.name
                            },

                            sound: CONFIG.sounds.dice,
                            flags: {
                                darksheet: {
                                    outcome: 'bad'
                                }
                            }
                        });
                    }
                    // Lower burnoutdie rank
                    const new_burnoutdie = rollings.indexOf(this.actor.data.data.attributes.burnout.value) + 1;
                    if (new_burnoutdie < rollings.length) {
                        this.actor.data.data.attributes.burnout.value = rollings[new_burnoutdie];
                    }
                    this.render();
                } else {
                    ChatMessage.create({
                        user: game.user._id,
                        content: content,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },
                        sound: CONFIG.sounds.dice
                    });
                }
            }
        });
        html.find('.foodcheckbox').change(event => {
            console.log("(DarkSheet): Food Value Changed");
        });
        //AUTOMATIC EXHAUSTION CALCULATION
        html.find('.exhaustioncalc').click(event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustionpoints.value;
            //Temperature Exhaustion
            if (temp === "exenegised") {
                newexhaustion += -1;
            } else if (temp === "exvsleepy" || temp === "exbarely") {
                newexhaustion += 1;
            }
            //Food Exhaustion
            if (food === "foodstuffed") {
                newexhaustion += -1;
            } else if (food === "foodravenous" || food === "foodstarving") {
                newexhaustion += 1;
            }
            //Water Exhaustion
            if (water === "wquenched") {
                newexhaustion += -1;
            } else if (water === "wdry" || water === "wdehydrated") {
                newexhaustion += 1;
            }
            //Fatigue Exhaustion
            if (fatigue === "exenegised") {
                newexhaustion += -1;
            } else if (fatigue === "exvsleepy" || fatigue === "exbarely") {
                newexhaustion += 1;
            }
            //exhaustion over 3?
            if (newexhaustion >= 4) {
                console.log("(DarkSheet): Maximum exhaustion achieved through needs. Total exhaustion from fron needs cannot exceed 3");
                newexhaustion = 3;
            }
            //adding manual exhaustion
            newexhaustion = (newexhaustion * 1 + manualexhaustion * 1);
            //exhaustion <0?
            if (newexhaustion <= 0) {
                newexhaustion = 0;
            }
            this.actor.data.data.attributes.newexhaustion = newexhaustion;
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
            this.render();
        });
        html.find('.staminacheck').click(event => {
            event.preventDefault();
            const roll = new Roll(`1d6`).roll();
            let content = `
				<div class="dnd5e chat-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3 style=" color: Orange; margin-top: 7px;">Stamina Check</h3>
					<h3 class="white" style= " margin-top: 7px;"> +1 Hunger</h3>
					</header>
				</div>`;
            let content2 = `
				<div class="dnd5e chat-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3 style=" color: Orange; margin-top: 7px;">Stamina Check</h3>
					<h3 class="white" style= " margin-top: 7px;">+1 Thirst</h3>
					</header>
				</div>`;
            let content3 = `
				<div class="dnd5e chat-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3 style=" color: Orange; margin-top: 7px;">Stamina Check</h3>
					<h3 class="white" style= " margin-top: 7px;">+1 Fatigue</h3>
					</header>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            if (roll.result <= 2) {
                console.log("(DarkSheet): Hunger");
                ChatMessage.create({
                    user: game.user._id,
                    content: content,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
				let food;
                if (this.actor.data.data.attributes.saturation.value === "foodstuffed") {
                    console.log("(DarkSheet): Your stuffed character is now well-fed");
                    food = "foodwellfed";
                } else if (this.actor.data.data.attributes.saturation.value === "foodwellfed") {
                    console.log("(DarkSheet): Your well-fed character is now ok");
                    food = "foodok";
                } else if (this.actor.data.data.attributes.saturation.value === "foodok") {
                    console.log("(DarkSheet): Your ok character is now pekish");
                    food = "foodpekish";
                } else if (this.actor.data.data.attributes.saturation.value === "foodpekish") {
                    console.log("(DarkSheet): Your pekish character is now hungry");
                    food = "foodhungry";
                } else if (this.actor.data.data.attributes.saturation.value === "foodhungry") {
                    console.log("(DarkSheet): Your hungry character is now ravenous");
                    food = "foodravenous";
                } else if (this.actor.data.data.attributes.saturation.value === "foodravenous") {
                    console.log("(DarkSheet): Your foodravenous character is now foodstarving");
                    food = "foodstarving";
                } else {
                    console.log("(DarkSheet): You are starving");
                }
				this.actor.update({'data.attributes.saturation.value': food});
                this.render();
            } else if (roll.result <= 4) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content2,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
				let water;
                if (this.actor.data.data.attributes.thirst.value === "wquenched") {
                    console.log("(DarkSheet): Your quenched character is now refreshed");
                    water = "wrefreshed";
                } else if (this.actor.data.data.attributes.thirst.value === "wrefreshed") {
                    console.log("(DarkSheet): Your refreshed character is now ok");
                    water = "wok";
                } else if (this.actor.data.data.attributes.thirst.value === "wok") {
                    console.log("(DarkSheet): Your ok character is now parched");
                    water = "wparched";
                } else if (this.actor.data.data.attributes.thirst.value === "wparched") {
                    console.log("(DarkSheet): Your parched character is now thirsty");
                    water = "wthirsty";
                } else if (this.actor.data.data.attributes.thirst.value === "wthirsty") {
                    console.log("(DarkSheet): Your thirsty character is now dry");
                    water = "wdry";
                } else if (this.actor.data.data.attributes.thirst.value === "wdry") {
                    console.log("(DarkSheet): Your dry character is now dehydrated");
                    water = "wdehydrated";
                } else {
                    console.log("(DarkSheet): You are dehydrating");
                }
				this.actor.update({'data.attributes.thirst.value': water});
                this.render();
            } else {
                ChatMessage.create({
                    user: game.user._id,
                    content: content3,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
				let fatigue;
                if (this.actor.data.data.attributes.fatigue.value === "exenegised") {
                    console.log("(DarkSheet): Your energised character is now well-rested");
                    fatigue = "exwell";
                } else if (this.actor.data.data.attributes.fatigue.value === "exwell") {
                    console.log("(DarkSheet): Your well-rested character is now ok");
                    fatigue = "exok";
                } else if (this.actor.data.data.attributes.fatigue.value === "exok") {
                    console.log("(DarkSheet): Your ok character is now tired");
                    fatigue = "extired";
                } else if (this.actor.data.data.attributes.fatigue.value === "extired") {
                    console.log("(DarkSheet): Your tired character is now sleepy");
                    fatigue = "exsleepy";
                } else if (this.actor.data.data.attributes.fatigue.value === "exsleepy") {
                    console.log("(DarkSheet): Your sleepy character is now very sleepy");
                    fatigue = "exvsleepy";
                } else if (this.actor.data.data.attributes.fatigue.value === "exvsleepy") {
                    console.log("(DarkSheet): Your very sleepy character is now barely awake");
                    fatigue = "exbarely";
                } else {
                    console.log("(DarkSheet): You are barely awake");
                }
				this.actor.update({'data.attributes.fatigue.value': fatigue});
                this.render();
            }
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustionpoints.value;
            //Temperature Exhaustion
            if (temp === "exenegised") {
                newexhaustion += -1;
            } else if (temp === "exvsleepy" || temp === "exbarely") {
                newexhaustion += 1;
            }
            //Food Exhaustion
            if (food === "foodstuffed") {
                newexhaustion += -1;
            } else if (food === "foodravenous" || food === "foodstarving") {
                newexhaustion += 1;
            }
            //Water Exhaustion
            if (water === "wquenched") {
                newexhaustion += -1;
            } else if (water === "wdry" || water === "wdehydrated") {
                newexhaustion += 1;
            }
            //Fatigue Exhaustion
            if (fatigue === "exenegised") {
                newexhaustion += -1;
            } else if (fatigue === "exvsleepy" || fatigue === "exbarely") {
                newexhaustion += 1;
            }
            //exhaustion over 3?
            if (newexhaustion >= 4) {
                console.log("(DarkSheet): Maximum exhaustion achieved through needs. Total exhaustion from fron needs cannot exceed 3");
                newexhaustion = 3;
            }
            //adding manual exhaustion
            newexhaustion = (newexhaustion * 1 + manualexhaustion * 1);
            //exhaustion <0?
            if (newexhaustion <= 0) {
                newexhaustion = 0;
            }
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
			this.actor.update({'data.attributes.newexhaustion': newexhaustion});
            this.render();
        });

        html.find('.exhaustionstatus').click(event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustionpoints.value;
            //Temperature Exhaustion
            if (temp === "exenegised") {
                newexhaustion += -1;
            } else if (temp === "exvsleepy" || temp === "exbarely") {
                newexhaustion += 1;
            }
            //Food Exhaustion
            if (food === "foodstuffed") {
                newexhaustion += -1;
            } else if (food === "foodravenous" || food === "foodstarving") {
                newexhaustion += 1;
            }
            //Water Exhaustion
            if (water === "wquenched") {
                newexhaustion += -1;
            } else if (water === "wdry" || water === "wdehydrated") {
                newexhaustion += 1;
            }
            //Fatigue Exhaustion
            if (fatigue === "exenegised") {
                newexhaustion += -1;
            } else if (fatigue === "exvsleepy" || fatigue === "exbarely") {
                newexhaustion += 1;
            }
            //exhaustion over 3?
            if (newexhaustion >= 4) {
                console.log("(DarkSheet): Maximum exhaustion achieved through needs. Total exhaustion from fron needs cannot exceed 3");
                newexhaustion = 3;
            }
            //adding manual exhaustion
            newexhaustion = (newexhaustion * 1 + manualexhaustion * 1);
            //exhaustion <0?
            if (newexhaustion <= 0) {
                newexhaustion = 0;
            }
            this.actor.data.data.attributes.newexhaustion = newexhaustion;
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
			this.actor.update({'data.attributes.newexhaustion': newexhaustion});
            this.render();
            let exhaustion = this.actor.data.data.attributes.newexhaustion;
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 1</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Ability Checks</h3>
				</div>`;
            let content2 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 2</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Ability Checks</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Speed halved</h3>
				</div>`;
            let content3 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 3</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Ability Checks</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Speed halved</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Attack rolls and Saving Throws</h3>
				</div>`;
            let content4 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 4</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Ability Checks</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Speed halved</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Attack rolls and Saving Throws</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Hit point maximum halved</h3>
				</div>`;
            let content5 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 5</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Ability Checks</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Speed halved</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Disadvantage on Attack rolls and Saving Throws</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Hit point maximum halved</h3>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Speed reduced to 0</h3>
				</div>`;
            let content6 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Exhaustion 6</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">Death</h3>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            if (newexhaustion === 1) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'table'
                        }
                    }
                });
            } else if (newexhaustion === 2) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content2,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'table'
                        }
                    }
                });
            } else if (newexhaustion === 3) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content3,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else if (newexhaustion === 4) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content4,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else if (newexhaustion === 5) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content5,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else if (newexhaustion === 6) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content6,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    blind: rollBlind,
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            }
        });

        html.find('.deathsaveroll').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Death Saving Throw");
            const result = table.roll()
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Death Saving Throw</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">${result[1].text}</h3>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;

            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                blind: rollBlind,
                sound: CONFIG.sounds.dice,
                flags: {
                    darksheet: {
                        outcome: 'bad'
                    }
                }
            });
        });
        //Inspiration
        html.find('.useInspiration').click(event => {
            event.preventDefault();
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            if (this.actor.data.data.attributes.inspirations.value <= 0) {
                ChatMessage.create({
                    user: game.user._id,
                    content: `<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3 style="color:red">You don't have any Inspiration</h3>
							</header>
							You can spend inspiration to make an attack roll, saving throw, or ability check with advantage-though you must declare this before you make the roll.</br> You can spend inspiration take the turn of an enemy.
						</br>
					</div>`,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else {
                ChatMessage.create({
                    user: game.user._id,
                    content: `<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3 class="white" style= "text-shadow: 0 0 2px;">${this.actor.name} Uses an Inspiration</h3>
							</header>
							You can spend inspiration to make an attack roll, saving throw, or ability check with advantage-though you must declare this before you make the roll.</br> You can spend inspiration take the turn of an enemy.
						</br>
					</div>`,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
                let val = this.actor.data.data.attributes.inspirations.value - 1;
				this.actor.update({'data.attributes.inspirations.value': val});
                this.render();
            }

        });
        //Hero Points
        html.find('.useHeroPoint').click(event => {
            event.preventDefault();
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            if (this.actor.data.data.attributes.heropoints.value <= 0) {
                ChatMessage.create({
                    user: game.user._id,
                    content: `<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3 style="color:red">You don't have any Hero Point's</h3>
							</header>
							<div>You can use a hero point to give yourself (1d6) bonus on one roll
							</br>- To turn a critical failure into a normal one
							</br>- To turn a critical strike against you into a normal
							</br>- To immediately reduce your stress by 5
							</br>- To improve one of your conditions temporarily by 2 (1d4) hours
							</br>- You can use 2 points to give you +6 on any roll.
							</div>
						</br>
					</div>`,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else {
                ChatMessage.create({
                    user: game.user._id,
                    content: `<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3 class="white" style= "text-shadow: 0 0 2px;">${this.actor.name} Uses an Hero Point</h3>
							</header>
							<div>You can use a hero point to give yourself [[/r 1d6 bonus]] on one roll
							</br>- To turn a critical failure into a normal one
							</br>- To turn a critical strike against you into a normal
							</br>- To immediately reduce your stress by 5
							</br>- To improve one of your conditions temporarily by 2 [[/r 1d4 hours]]
							</br>- You can use 2 points to give you +6 on any roll.
							</div>
						</br>
					</div>`,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },

                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
				let val = this.actor.data.data.attributes.heropoints.value - 1;
				this.actor.update({'data.attributes.heropoints.value': val});
                this.render();
            }

        });
        // LOOK FOR WOUNDROLL
        html.find('.woundroll').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Reopening Wounds");
            let wounds = this.actor.data.data.attributes.wounds.value;
            let i = 0;
            let subtractVal = 0;
            for (i = wounds; i > 0; i = i - 1) {
                //let result = table.roll()
                let roll = new Roll(`1d20`).roll().total;
                let epicfail = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Woundroll #${i}</h3>
					</header>
					</br>
					<b><i style="color: #ff0000">The wound reopens +1 Exhaustion and you lose a hit die
				</div>`;
                let fail = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Woundroll #${i}</h3>
					</header>
					</br>
					<i style="color: #ff0000">The wound reopens + 1 Exhaustion
				</div>`;
                let success = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Woundroll #${i}</h3>
					</header>
					</br>
					The wound remains closed
				</div>`;
                let rollWhisper = null;
                let rollBlind = false;
                let rollMode = game.settings.get("core", "rollMode");
                if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
                if (rollMode === "blindroll") rollBlind = true;
                if (roll <= 1) {
                    ChatMessage.create({
                        user: game.user._id,
                        content: epicfail,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },
                        blind: rollBlind,
                        sound: CONFIG.sounds.dice,
                        flags: {
                            darksheet: {
                                outcome: 'table'
                            }
                        }
                    });
                    this.actor.data.data.attributes.wounds.value--;
                    this.actor.data.data.attributes.hd--;
                    this.actor.data.data.attributes.exhaustionpoints.value++;
                } else if (roll <= 8) {
                    ChatMessage.create({
                        user: game.user._id,
                        content: fail,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },

                        blind: rollBlind,
                        sound: CONFIG.sounds.dice,
                        flags: {
                            darksheet: {
                                outcome: 'table'
                            }
                        }
                    });
                    this.actor.data.data.attributes.wounds.value--;
                    this.actor.data.data.attributes.exhaustionpoints.value++;
                } else {
                    ChatMessage.create({
                        user: game.user._id,
                        content: success,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },

                        blind: rollBlind,
                        sound: CONFIG.sounds.dice,
                        flags: {
                            darksheet: {
                                outcome: 'table'
                            }
                        }
                    });
                }
            };
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustionpoints.value;
            //Temperature Exhaustion
            if (temp === "exenegised") {
                newexhaustion += -1;
            } else if (temp === "exvsleepy" || temp === "exbarely") {
                newexhaustion += 1;
            }
            //Food Exhaustion
            if (food === "foodstuffed") {
                newexhaustion += -1;
            } else if (food === "foodravenous" || food === "foodstarving") {
                newexhaustion += 1;
            }
            //Water Exhaustion
            if (water === "wquenched") {
                newexhaustion += -1;
            } else if (water === "wdry" || water === "wdehydrated") {
                newexhaustion += 1;
            }
            //Fatigue Exhaustion
            if (fatigue === "exenegised") {
                newexhaustion += -1;
            } else if (fatigue === "exvsleepy" || fatigue === "exbarely") {
                newexhaustion += 1;
            }
            //exhaustion over 3?
            if (newexhaustion >= 4) {
                console.log("(DarkSheet): Maximum exhaustion achieved through needs. Total exhaustion from fron needs cannot exceed 3");
                newexhaustion = 3;
            }
            //adding manual exhaustion
            newexhaustion = (newexhaustion * 1 + manualexhaustion * 1);
            //exhaustion <0?
            if (newexhaustion <= 0) {
                newexhaustion = 0;
            }
            this.actor.data.data.attributes.newexhaustion = newexhaustion;
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
			if(this.actor.data.data.attributes.newexhaustion != newexhaustion){
			this.actor.update({'data.attributes.newexhaustion': newexhaustion});
			}
            this.render();
        });
        html.find('.treatwound').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Treatwounds");
            const result = table.roll()
            let content = `
					<h3 style="text-shadow: 0 0 4px; text-align: center;">${result[1].text}</h3>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;

            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                blind: rollBlind,
                sound: CONFIG.sounds.dice,
                flags: {
                    darksheet: {
                        outcome: 'table'
                    }
                }
            });
        });

        html.find('.healwound').click(event => {
            event.preventDefault();
            let conmod = this.actor.data.data.abilities.con.mod;
            let healtotal = 0;
            let wounds = this.actor.data.data.attributes.wounds.value;
            let maxwounds = this.actor.data.data.attributes.maxwounds.value;
            let i = 0;
            for (i = maxwounds; i > 0; i = i - 1) {
                let roll = new Roll(`1d20`).roll().total;
                let rolltotal = roll + conmod;
                if (rolltotal >= 15) {
                    healtotal++;
                }
            }
			let newwound = this.actor.data.data.attributes.maxwounds.value - healtotal;
			this.actor.update({'data.attributes.maxwounds.value': newwound});
            if (wounds >= newwound) {
                this.actor.update({'data.attributes.wounds.value': newwound});
            }
            this.render();

            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            ChatMessage.create({
                user: game.user._id,
                content: `<div class="messagecards">
				<b style=" color: #9dff00; margin-left: 17%;text-shadow: 0 0 0px;">Wound Heal (Long Rest) DC 15:</b> <br><i>
						<h4 style="text-shadow: 0 0 0px; text-align: center;"> You heal a total of ${healtotal} wounds</h4>
					</div>
				</div>`,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },

                blind: rollBlind,
                sound: CONFIG.sounds.dice
            });
        });
        html.find('.criticalS').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Critical Success Boons");
            let rollMode = game.settings.get("core", "rollMode");
            let isWhisper = false;
            if (["gmroll", "blindroll"].includes(rollMode)) {
                isWhisper = ChatMessage.getWhisperIDs("GM");
            }
            const result = table.roll()
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<h3 style="text-shadow: 0 0 1px; text-align: center;">${result[1].text}</h3>
				</div>`;

            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                sound: CONFIG.sounds.dice,
                rollMode: rollMode,
                whisper: isWhisper
            });
        });
        html.find('.criticalF').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Critical Failure Consequences");
            const result = table.roll()
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<h3 style="text-shadow: 0 0 1px; text-align: center;">${result[1].text}</h3>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;

            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                blind: rollBlind,
                sound: CONFIG.sounds.dice,
                flags: {
                    darksheet: {
                        outcome: 'bad'
                    }
                }
            });
        });
        html.find('.successatcost').click(event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Success at a Cost - Offerings");
            const result = table.roll()
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<h3 style="text-shadow: 0 0 0px; text-align: center;">${result[1].text}</h3>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;

            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                blind: rollBlind,
                sound: CONFIG.sounds.dice,
                flags: {
                    darksheet: {
                        outcome: 'table'
                    }
                }
            });
        });

        html.find('.hitdiceroll').click(event => {
            event.preventDefault();
            let hd = this.actor.data.data.attributes.hitdice.value;
            let conmod = this.actor.data.data.abilities.con.mod;
            let roll1 = new Roll(`${hd}`).roll().total + conmod;
            let hp = this.actor.data.data.attributes.hp.value;
            // Send content to chat
            let rollWhisper = null;
            let rollBlind = false;
            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Rolling hitdice</h3>(${hd} + ${conmod})
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">${roll1}</h3>
			</div>`;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = true;
            // If Epic fail
            ChatMessage.create({
                user: game.user._id,
                content: content,
                speaker: {
                    actor: this.actor._id,
                    token: this.actor.token,
                    alias: this.actor.name
                },
                sound: CONFIG.sounds.dice,
                flags: {
                    darksheet: {
                        outcome: 'table'
                    }
                }
            });
            const newhp = this.actor.data.data.attributes.hp.value + roll1;
            if (newhp >= this.actor.data.data.attributes.hp.max) {
                this.actor.data.data.attributes.hp.value = his.actor.data.data.attributes.hp.max
            } else {
                this.actor.data.data.attributes.hp.value = newhp
            }
        });

        /*LOOK FOR DEFENSEROLL*/
        html.find('.handy-ac').click(event => {
            event.preventDefault();
            let ac = this.actor.data.data.attributes.ac.value;
            let roll1 = new Roll(`d20`).roll().total;
            let roll2 = new Roll(`d20`).roll().total;
            let rollResult = new Roll(`${roll1}+${ac}`).roll().total;
            let rollResult2 = new Roll(`${roll2}+${ac}`).roll().total;
            let wounds = this.actor.data.data.attributes.wounds.value;
            let content = `
<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
    <header class="card-header flexrow">
        <img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;" />        <div class="dice-roll red-dual">
            <h3>Active Defense</h3>
            <div class="dice-result">
                <div class="dice-formula dice-tooltip" style="display: none;">1d20 + ${ac}</div>
                <div class="dice-row">
                    <div class="dice-row">
                        <div class="tooltip dual-left">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll1}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                        <div class="tooltip dual-right">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult2}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll2}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                    </div>
                </div>
                <div class="dice-row">
                    <h4 class="dice-total dual-left">${rollResult}</h4>
                    <h4 class="dice-total dual-right">${rollResult2}</h4>
                </div>
            </div>
        </div>
    </header>
</div>`;
            let content2 = `
<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
    <header class="card-header flexrow">
        <img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;" />        <div class="dice-roll red-dual">
            <h3>Defense Roll</h3>
            <div class="dice-result">
                <div class="dice-formula dice-tooltip" style="display: none;">1d20 + ${ac}</div>
                <div class="dice-row">
                    <div class="dice-row">
                        <div class="tooltip dual-left">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll1}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                        <div class="tooltip dual-right">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult2}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll2}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                    </div>
                </div>
                <div class="dice-row">
                    <h4 class="dice-total dual-left" style="color: red;text-shadow: 0 0 3px;">${rollResult}</h4>
                    <h4 class="dice-total dual-right">${rollResult2}</h4>
                </div>
            </div>
        </div>
    </header>
	</br>
	<h4 class="woundroll" style="text-align: center;">You need to <b>roll</br> for ${wounds} wound(s)</h4>
	<h4 style="text-align: center;">One of your items gains a notch<h4>
</div>`;
            let content3 = `
<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
    <header class="card-header flexrow">
        <img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;" />        <div class="dice-roll red-dual">
            <h3>Defense Roll</h3>
            <div class="dice-result">
                <div class="dice-formula dice-tooltip" style="display: none;">1d20 + ${ac}</div>
                <div class="dice-row">
                    <div class="dice-row">
                        <div class="tooltip dual-left">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll1}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                        <div class="tooltip dual-right">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        <span class="part-total">${rollResult2}</span>
                                    </p>
                                    <ol class="dice-rolls">
                                        <li class="roll d20">${roll2}</li>
                                    </ol>
                                </div>                            </div>
                        </div>
                    </div>
                </div>
                <div class="dice-row">
                    <h4 class="dice-total dual-left">${rollResult}</h4>
                    <h4 class="dice-total dual-left" style="color: red;text-shadow: 0 0 3px;">${rollResult2}</h4>
                </div>
            </div>
        </div>
    </header>
	</br>
	<h4 class="woundroll" style="text-align: center;">You need to <b>roll</br> for ${wounds} wound(s)</h4>
	<h4 style="text-align: center;">One of your items gains a notch<h4>
</div>`;
            // Send content to chat
            let rollWhisper = false;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperIDs("GM");
            if (rollMode === "blindroll") rollBlind = false;
            // If Epic fail
            if (roll1 === 1) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content2,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else if (roll2 === 1) {
                ChatMessage.create({
                    user: game.user._id,
                    content: content3,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'bad'
                        }
                    }
                });
            } else {
                ChatMessage.create({
                    user: game.user._id,
                    content: content,
                    speaker: {
                        actor: this.actor._id,
                        token: this.actor.token,
                        alias: this.actor.name
                    },
                    sound: CONFIG.sounds.dice,
                    flags: {
                        darksheet: {
                            outcome: 'table'
                        }
                    }
                });
            }
        });
        /*END LOOK FOR DEFENSEROLL END*/
    }
}