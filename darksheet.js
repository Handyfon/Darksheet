import {
    ActorSheet5eCharacter
} from '../../../../modules/darksheet/actor/sheets/character.js';
import { _getInitiativeFormula } from "./js/combat.js";
//Load Templates
Hooks.once('init', () => loadTemplates([
    'modules/darksheet/templates/actors/parts/actor-inventory.html',
    'modules/darksheet/templates/actors/parts/actor-spellbook.html',
    'modules/darksheet/templates/actors/parts/actor-features.html',
    'modules/darksheet/templates/items/parts/item-description.html'
]));

//Register Sheet
Hooks.once('init', function() {
	
    Actors.registerSheet('dnd5e', DarkSheet, {
        types: ['character']
    });
    Items.registerSheet('dnd5e', ItemSheet5e);
    game.settings.register('darksheet', 'slotbasedinventory', {
        name: 'Slot based inventory',
        hint: 'This option determines on which value the bar at the bottom of the inventory uses, if his is enabled it will use slots instead of weight.',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
	    game.settings.register('darksheet', 'ActiveInitiativeHadTurn', {
        name: 'Saves Turn Value',
        hint: 'Dont Touch',
        scope: 'world',
        config: false,
        default: "",
        type: String,
    });
	game.settings.register('darksheet', 'activeInitiative', {
        name: 'Active Initiative [TESTING]"',
        hint: 'Enables Active Initiative',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
	game.settings.register('darksheet', 'activeInitiativeDisplayTurns', {
        name: 'ActiveIni AdditionalDisplay',
        hint: 'Enable additional actors display during active initiativee',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
	game.settings.register('darksheet', 'savecantrips', {
        name: 'Variant Rule "Safe Cantrips"',
        hint: 'If this is checked it will disable the ability to select the d12 for the burnout die. ',
        scope: 'world',
        config: true,
        default: false,
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
    game.settings.register('darksheet', 'hidenotches', {
        name: 'Hide Notches',
        hint: 'Enable to hide the notches from players inventories and from item-sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'disablefragility', {
        name: 'Disable Fragility',
        hint: 'Check to disable fragility and hide it from item-sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'disabletemper', {
        name: 'Disable Tempering',
        hint: 'Check to disable item-tempering and hide it from item-sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hidedamageac', {
        name: 'Hide DAMAGE & AC',
        hint: 'Check to disable the display of the current damage/ac of an item behind that item',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'disableitemquality', {
        name: 'Disable Item-Quality',
        hint: 'Check to disable item-quality and hide it from item-sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hideammodie', {
        name: 'Hide Ammodie',
        hint: 'Enable to hide the ammodie-section from players inventories and from item-sheets',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'hideSRDCOMP', {
        name: 'Unloads SRD compendiums (Recommended)',
        hint: 'This option unloads all redundant SRD compendiums (requires reload)',
        scope: 'world',
        config: true,
        default: true,
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
    game.settings.register('darksheet', 'nonpcattack', {
        name: 'No NPC Attacks (Active Defense Instead!)',
        hint: '!Warning - Will Overwrite Actor Attacks ! Enable this if you want to only roll damage when using npc attacks ONLY SUPPORTS THE BetterNPCSheet5e',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'smalldefense', {
        name: 'Variant: Small Defense',
        hint: 'If you want to use smaller modifiers while playing with Active Defense, try this Small Defense variant. Defense Rolls: When you make a defense roll, roll a d20 and add your AC minus 10. The opposing DC is 12 plus the attackers normal attack bonus.',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'intmod', {
        name: 'Intelligent Initiative',
        hint: 'Enables the use of the intelligence modifier for the initiative roll',
        scope: 'world',
        config: true,
        default: true,
        type: Boolean,
    });
    game.settings.register('darksheet', 'destroyshatter', {
        name: 'Shattered items should NOT be destroyed.',
        hint: 'Enabling this will keep shattered items with [Shattered] in their name instead of deleting them',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'shatterwhen1', {
        name: '[Houserule] Shatter when 1',
        hint: 'Enabling this will shatter items when they reach 1 AC or 1 damage regardless of fragility',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
	game.settings.register('darksheet', 'silverstandard', {
        name: '[Houserule] Silver Standart',
        hint: 'All items will have sp worth instead of gp',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
    game.settings.register('darksheet', 'darkscreennames', {
        name: 'names',
        hint: 'names',
        scope: 'world',
        config: false,
        default: 'no',
        type: String,
    });
    game.settings.register('darksheet', 'darkscreenval', {
        name: 'values',
        hint: 'values',
        scope: 'world',
        config: false,
        default: 'no',
        type: String,
    });
    game.settings.register('darksheet', 'questtable', {
        name: 'values',
        hint: 'values',
        scope: 'world',
        config: false,
        default: 'no',
        type: String,
    });
	
	game.settings.register('darksheet', 'globalTemp', {
        name: 'GM Managed Temperature',
        hint: 'Players can no longer select their temperature on their character sheets, you can still change the regional magic as gm or with the darkscreen',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
	game.settings.register('darksheet', 'globalRegMagic', {
        name: 'GM Managed Regional Magic',
        hint: 'Players can no longer select regional magic on their character sheets, you can still change the regional magic as gm or with the darkscreen',
        scope: 'world',
        config: true,
        default: false,
        type: Boolean,
    });
	game.settings.register('darksheet', 'afflictionFromComp', {
        name: 'Afflictions from Compendium',
        hint: 'Enabling this option will roll from the Afflictions compendium instead of the rollable table and display the compendium entry in chat.',
        scope: 'world',
        config: false,
        default: false,
        type: Boolean,
    });
    console.log("Darker Dungeons | Initializing Darker Dungeons for the D&D 5th Edition System\n", "_____________________________________________________________________________________________\n", "  ____                _                 ____                                                \n", " |  _ \\   __ _  _ __ | | __ ___  _ __  |  _ \\  _   _  _ __    __ _   ___   ___   _ __   ___ \n", " | | | | / _` || '__|| |/ // _ \| '__|  | | | || | | || '_ \\  / _` | / _ \\ / _ \\ | '_ \\ / __| \n", " | |_| || (_| || |   |   <|  __/| |    | |_| || |_| || | | || (_| ||  __/| (_) || | | |\\__ \\ \n", " |____/  \\__,_||_|   |_|\\_\\\\___||_|    |____/  \\__,_||_| |_| \\__, | \\___| \\___/ |_| |_||___/ \n", "                                                             |___/                          \n", "_____________________________________________________________________________________________");
    console.log();
});
//on Update Actor check for status
Hooks.on('updateActor', (actor, updates, options, userId) => {
	if(actor.data.type!="character") return;
	//UPDATE CUSTOM SHEET VALUE AND DISPLAY HIDDEN OPTIONS
	let customsheet;
	if (actor.data.data.attributes.color === undefined) {}
	else if (actor.data.data.attributes.color.value === "custom") {
		customsheet = true;
		actor.update({
			'data.attributes.color.custom': customsheet
		});
	} else {
		customsheet = false;
		actor.update({
			'data.attributes.color.custom': customsheet
		});
	}
	if(actor.data.data.attributes.automaticexhaust){
			let newexhaustion = 0;
			let temp = actor.data.data.attributes.temp;
			let food = actor.data.data.attributes.saturation.value;
			let water = actor.data.data.attributes.thirst.value;
			let fatigue = actor.data.data.attributes.fatigue.value;
			let manualexhaustion = actor.data.data.attributes.exhaustion.value;
			let closedwounds = actor.data.data.attributes.wounds.value;
			let maxwounds = 0;
			if(actor.data.data.attributes.maxwounds != null){
				maxwounds = actor.data.data.attributes.maxwounds.value;
			}
			else{
			}
			//console.log("ExhaustionTRACKINGGGGG");
			let woundexhaustion = maxwounds - closedwounds;
			newexhaustion += woundexhaustion;
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
			let exhaustion1 = false;
			let exhaustion2 = false;
			let exhaustion3 = false;
			let exhaustion4 = false;
			let exhaustion5 = false;
			if (newexhaustion === 1) {
				exhaustion1 = true;
			} else if (newexhaustion === 2) {
				exhaustion2 = true;
			} else if (newexhaustion === 3) {
				exhaustion3 = true;
			} else if (newexhaustion === 4) {
				exhaustion4 = true;
			} else if (newexhaustion === 5) {
				exhaustion5 = true;
			}
			if (actor.data.data.attributes.newexhaustion != newexhaustion) {
				actor.update({
					'data.attributes.newexhaustion': newexhaustion,
					'data.status.isExhaustion1': exhaustion1,
					'data.status.isExhaustion2': exhaustion2,
					'data.status.isExhaustion3': exhaustion3,
					'data.status.isExhaustion4': exhaustion4,
					'data.status.isExhaustion5': exhaustion5
				});
				console.log("(DarkSheet): New Exhaustion: " + actor.data.data.attributes.newexhaustion);
			}
	}
	//STATUS UPDATES
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
			const restrained = "modules/combat-utility-belt/icons/restrained.svg";
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

					if (actorData.data.status.isRestrained && !t.data.effects.includes(restrained)) await t.toggleEffect(restrained);
					if (!actorData.data.status.isRestrained && t.data.effects.includes(restrained)) await t.toggleEffect(restrained);

					if (actorData.data.status.isStunned && !t.data.effects.includes(stunned)) await t.toggleEffect(stunned);
					if (!actorData.data.status.isStunned && t.data.effects.includes(stunned)) await t.toggleEffect(stunned);

					if (actorData.data.status.isUnconscious && !t.data.effects.includes(unconscious)) await t.toggleEffect(unconscious);
					if (!actorData.data.status.isUnconscious && t.data.effects.includes(unconscious)) await t.toggleEffect(unconscious);

					if (actorData.data.status.isConcentrating && !t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);
					if (!actorData.data.status.isConcentrating && t.data.effects.includes(concentrating)) await t.toggleEffect(concentrating);

					if (actorData.data.status.isExhaustion1 && !t.data.effects.includes(exhaustion1)) await t.toggleEffect(exhaustion1);
					if (!actorData.data.status.isExhaustion1 && t.data.effects.includes(exhaustion1)) await t.toggleEffect(exhaustion1);

					if (actorData.data.status.isExhaustion2 && !t.data.effects.includes(exhaustion2)) await t.toggleEffect(exhaustion2);
					if (!actorData.data.status.isExhaustion2 && t.data.effects.includes(exhaustion2)) await t.toggleEffect(exhaustion2);

					if (actorData.data.status.isExhaustion3 && !t.data.effects.includes(exhaustion3)) await t.toggleEffect(exhaustion3);
					if (!actorData.data.status.isExhaustion3 && t.data.effects.includes(exhaustion3)) await t.toggleEffect(exhaustion3);

					if (actorData.data.status.isExhaustion4 && !t.data.effects.includes(exhaustion4)) await t.toggleEffect(exhaustion4);
					if (!actorData.data.status.isExhaustion4 && t.data.effects.includes(exhaustion4)) await t.toggleEffect(exhaustion4);

					if (actorData.data.status.isExhaustion5 && !t.data.effects.includes(exhaustion5)) await t.toggleEffect(exhaustion5);
					if (!actorData.data.status.isExhaustion5 && t.data.effects.includes(exhaustion5)) await t.toggleEffect(exhaustion5);

					//EXHAUSTION STATUS
					await t.drawEffects();
				}
			});
		}
	//Intelligent Initiative
	if(game.settings.get('darksheet', 'intmod')){
		actor.data.data.attributes.init.mod = actor.data.data.abilities.int.mod;
		actor.data.data.attributes.init.total = parseInt(actor.data.data.abilities.int.mod + actor.data.data.attributes.init.bonus + actor.data.data.attributes.init.prof);
		document.getElementById('initiativevalue').innerHTML = "+"+actor.data.data.attributes.init.total;
	}
});

//Check for preUpdateToken
Hooks.on('preUpdateToken', async (scene, sceneId, updates, tokenData) => {
    // if the update has no effects, return
    if (!sceneId.actorLink) return;
    const tokenActor = game.actors.entities.find(a => a.id == sceneId.actorId);
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
    const restrained = "modules/combat-utility-belt/icons/restrained.svg";
    const stunned = "modules/combat-utility-belt/icons/stunned.svg";
    const unconscious = "modules/combat-utility-belt/icons/unconscious.svg";
    const concentrating = "modules/combat-utility-belt/icons/concentrating.svg";
    const exhaustion1 = "modules/combat-utility-belt/icons/exhaustion1.svg";
    const exhaustion2 = "modules/combat-utility-belt/icons/exhaustion2.svg";
    const exhaustion3 = "modules/combat-utility-belt/icons/exhaustion3.svg";
    const exhaustion4 = "modules/combat-utility-belt/icons/exhaustion4.svg";
    const exhaustion5 = "modules/combat-utility-belt/icons/exhaustion5.svg";

    await tokenActor.update({
        "data.status.isBlinded": updates.effects.includes(blinded),
        "data.status.isDeafened": updates.effects.includes(deafened),
        "data.status.isDying": updates.effects.includes(dying),
        "data.status.isFrightened": updates.effects.includes(frightened),
        "data.status.isGrappled": updates.effects.includes(grappled),
        "data.status.isIncapacitated": updates.effects.includes(incapacitated),
        "data.status.isInvisible": updates.effects.includes(invisible),
        "data.status.isParalyzed": updates.effects.includes(paralyzed),
        "data.status.isPetrified": updates.effects.includes(petrified),
        "data.status.isPoisoned": updates.effects.includes(poisoned),
        "data.status.isProne": updates.effects.includes(prone),
        "data.status.isRestrained": updates.effects.includes(restrained),
        "data.status.isStunned": updates.effects.includes(stunned),
        "data.status.isUnconscious": updates.effects.includes(unconscious),
        "data.status.isConcentrating": updates.effects.includes(concentrating),
        "data.status.isExhaustion1": updates.effects.includes(exhaustion1),
        "data.status.isExhaustion2": updates.effects.includes(exhaustion2),
        "data.status.isExhaustion3": updates.effects.includes(exhaustion3),
        "data.status.isExhaustion4": updates.effects.includes(exhaustion4),
        "data.status.isExhaustion5": updates.effects.includes(exhaustion5),
    });

});

Hooks.on('createChatMessage', (userId) => {
console.log("Chat Message Detected");

let message = userId.data.content;
let actor = game.actors.getName(userId.data.speaker.alias);
let spellburnout = false;
let iscantrip = false;
let onlyonce = false;
if(message.includes("<span>Cantrip</span>")){
iscantrip = true;
}
else if(message.includes("<span>V") || message.includes("<span>M") || message.includes("<span>S") || message.includes("slots")){
spellburnout = true;
}
else{return;}
if(game.user.character === undefined){
	return;
}
else if(iscantrip == false && spellburnout == true && actor.data.data.attributes.autmomaticburnout && game.user.character.data._id === actor.data._id || iscantrip == true && game.settings.get('darksheet', 'savecantrips') === false && actor.data.data.attributes.autmomaticburnout && game.user.character.data._id === actor.data._id ){
// Rolling table, from best to worst
            const rollings = ['12', '10', '8', '6', '4'];
            // Value of the burnoutdice
            let burnoutdie = actor.data.data.attributes.burnout.value;
            // find the table
            let table = game.tables.entities.find(t => t.data.name === "Burnout Consequence");
            // burnoutsettings
            let bsettings = actor.data.data.attributes.burnout.value
            // magic region
            var regionmod = parseInt(actor.data.data.attributes.regionmod.value, 10);
            //console.log("Regionmod: "+regionmod);
            // burnoutdice changed through region
            if (regionmod < 0) {
                var regionmodz = rollings.indexOf(actor.data.data.attributes.burnout.value) - parseInt(regionmod);
                //console.log("Regionmodz step2 kleiner: "+regionmodz);
                if (regionmodz >= 5) {
                    regionmodz = 4;
                }
            } else {
                var regionmodz = rollings.indexOf(actor.data.data.attributes.burnout.value) - parseInt(regionmod);
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
				<div class="dnd5e chat-card item-card" data-acor-id="${actor._id}">
					<header class="card-header flexrow">
						<img src="${actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3>${roll.result}</h3>
					</header>
				</div>`;
                let content2 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${actor._id}">
					<header class="card-header flexrow">
						<img src="${actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px;">${roll.result}</h3>
					</header>
					</br>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px; text-align: center;">${result.results[0].data.text}</h3>
				</div>`;
                let content3 = `
				<div class="dnd5e chat-card item-card" data-acor-id="${actor._id}">
					<header class="card-header flexrow">
						<img src="${actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Burnoutdice(${rollcona}): </h3>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px;">${roll.result}</h3>
					</header>
				</div>`;
                let rollWhisper = null;
                let rollBlind = false;
                let rollMode = game.settings.get("core", "rollMode");
                if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
                if (rollMode === "blindroll") rollBlind = true;
                if (roll.result <= 2) {
                    if (bsettings) {
                        ChatMessage.create({
                            user: game.user._id,
                            content: content2,
                            speaker: {
                                actor: actor._id,
                                token: actor.token,
                                alias: actor.name
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
                                actor: actor._id,
                                token: actor.token,
                                alias: actor.name
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
                    const new_burnoutdie = rollings.indexOf(actor.data.data.attributes.burnout.value) + 1;
                    if (new_burnoutdie < rollings.length) {
						actor.update({'data.attributes.burnout.value': new_burnoutdie});
                    }
                    actor.render();
                } else {
                    ChatMessage.create({
                        user: game.user._id,
                        content: content,
                        speaker: {
                            actor: actor._id,
                            token: actor.token,
                            alias: actor.name
                        },
                        sound: CONFIG.sounds.dice
                    });
                }
            }
	}
});

Hooks.on('createToken', async (scene, sceneId, tokenData, options, userId) => {
    if (!sceneId.actorLink) return;

    const actor = game.actors.entities.find(a => a.id == sceneId.actorId);

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
    const restrained = "modules/combat-utility-belt/icons/restrained.svg";
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

            if (actorData.data.status.isRestrained) await t.toggleEffect(restrained);

            if (actorData.data.status.isStunned) await t.toggleEffect(stunned);

            if (actorData.data.status.isUnconscious) await t.toggleEffect(unconscious);

            if (actorData.data.status.isConcentrating) await t.toggleEffect(concentrating);

            if (actorData.data.status.isExhaustion1) await t.toggleEffect(exhaustion1);
            if (actorData.data.status.isExhaustion2) await t.toggleEffect(exhaustion2);
            if (actorData.data.status.isExhaustion3) await t.toggleEffect(exhaustion3);
            if (actorData.data.status.isExhaustion4) await t.toggleEffect(exhaustion4);
            if (actorData.data.status.isExhaustion5) await t.toggleEffect(exhaustion5);
            await t.drawEffects();
        }
    });
});

/**
 * Override and extend the core ItemSheet implementation to handle D&D5E specific item types
 * @type {ItemSheet}
 */
export class ItemSheet5e extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 560,
            height: 420,
            classes: ["dnd5e", "sheet", "item"],
            resizable: false,
            scrollY: [".tab.details"],
            tabs: [{
                navSelector: ".tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
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
		const itemData = data.data;
		data.labels = this.item.labels;
		data.config = CONFIG.DND5E;

        // Include CONFIG values
        data.config = CONFIG.DND5E;

		// Item Type, Status, and Details
		data.itemType = game.i18n.localize(`ITEM.Type${data.item.type.titleCase()}`);
		data.itemStatus = this._getItemStatus(itemData);
		data.itemProperties = this._getItemProperties(itemData);
		data.isPhysical = itemData.data.hasOwnProperty("quantity");
		
		// Potential consumption targets
		data.abilityConsumptionTargets = this._getItemConsumptionTargets(itemData);

		// Action Details
		data.hasAttackRoll = this.item.hasAttack;
		data.isHealing = itemData.data.actionType === "heal";
		data.isFlatDC = getProperty(itemData, "data.save.scaling") === "flat";
		data.isLine = ["line", "wall"].includes(itemData.data.target?.type);
		
		// Original maximum uses formula
		const sourceMax = foundry.utils.getProperty(this.item.data._source, "data.uses.max");
		if ( sourceMax ) itemData.data.uses.max = sourceMax;


		// Re-define the template data references (backwards compatible)
		data.item = itemData;
		data.data = itemData.data;
		
		//DARKER DUNGEONS SPECIFIC
        data.hideammodie = game.settings.get('darksheet', 'hideammodie'); //
        data.hidenotches = game.settings.get('darksheet', 'hidenotches'); //
        data.disablefragility = game.settings.get('darksheet', 'disablefragility'); //
        data.disabletemper = game.settings.get('darksheet', 'disabletemper'); //
        data.disableitemquality = game.settings.get('darksheet', 'disableitemquality'); //
        data.hidedamageac = game.settings.get('darksheet', 'hidedamageac'); //
		data.savecantrips = game.settings.get('darksheet', 'savecantrips'); //
		data.silverstandard = game.settings.get('darksheet', 'silverstandard'); //
		data.slotbasedinventory = game.settings.get('darksheet', 'slotbasedinventory'); //

        return data;
    }
	/* -------------------------------------------- */

  /**
   * Get the valid item consumption targets which exist on the actor
   * @param {Object} item         Item data for the item being displayed
   * @return {{string: string}}   An object of potential consumption targets
   * @private
   */
  _getItemConsumptionTargets(item) {
    const consume = item.data.consume || {};
    if ( !consume.type ) return [];
    const actor = this.item.actor;
    if ( !actor ) return {};

    // Ammunition
    if ( consume.type === "ammo" ) {
      return actor.itemTypes.consumable.reduce((ammo, i) =>  {
        if ( i.data.data.consumableType === "ammo" ) {
          ammo[i.id] = `${i.name} (${i.data.data.quantity})`;
        }
        return ammo;
      }, {[item._id]: `${item.name} (${item.data.quantity})`});
    }

    // Attributes
    else if ( consume.type === "attribute" ) {
      const attributes = TokenDocument.getTrackedAttributes(actor.data.data);
      attributes.bar.forEach(a => a.push("value"));
      return attributes.bar.concat(attributes.value).reduce((obj, a) => {
        let k = a.join(".");
        obj[k] = k;
        return obj;
      }, {});
    }

    // Materials
    else if ( consume.type === "material" ) {
      return actor.items.reduce((obj, i) => {
        if ( ["consumable", "loot"].includes(i.data.type) && !i.data.data.activation ) {
          obj[i.id] = `${i.name} (${i.data.data.quantity})`;
        }
        return obj;
      }, {});
    }

    // Charges
    else if ( consume.type === "charges" ) {
      return actor.items.reduce((obj, i) => {

        // Limited-use items
        const uses = i.data.data.uses || {};
        if ( uses.per && uses.max ) {
          const label = uses.per === "charges" ?
            ` (${game.i18n.format("DND5E.AbilityUseChargesLabel", {value: uses.value})})` :
            ` (${game.i18n.format("DND5E.AbilityUseConsumableLabel", {max: uses.max, per: uses.per})})`;
          obj[i.id] = i.name + label;
        }

        // Recharging items
        const recharge = i.data.data.recharge || {};
        if ( recharge.value ) obj[i.id] = `${i.name} (${game.i18n.format("DND5E.Recharge")})`;
        return obj;
      }, {})
    }
    else return {};
  }

  /* -------------------------------------------- */
	
    /**
     * Get the text item status which is shown beneath the Item type in the top-right corner of the sheet
     * @return {string}
     * @private
     */
  _getItemStatus(item) {
    if ( item.type === "spell" ) {
      return CONFIG.DND5E.spellPreparationModes[item.data.preparation];
    }
    else if ( ["weapon", "equipment"].includes(item.type) ) {
      return game.i18n.localize(item.data.equipped ? "DND5E.Equipped" : "DND5E.Unequipped");
    }
    else if ( item.type === "tool" ) {
      return game.i18n.localize(item.data.proficient ? "DND5E.Proficient" : "DND5E.NotProficient");
    }
  }
	/* -------------------------------------------- */

  /**
   * Get the Array of item properties which are used in the small sidebar of the description tab
   * @return {Array}
   * @private
   */
  _getItemProperties(item) {
    const props = [];
    const labels = this.item.labels;

    if ( item.type === "weapon" ) {
      props.push(...Object.entries(item.data.properties)
        .filter(e => e[1] === true)
        .map(e => CONFIG.DND5E.weaponProperties[e[0]]));
    }

    else if ( item.type === "spell" ) {
      props.push(
        labels.components,
        labels.materials,
        item.data.components.concentration ? game.i18n.localize("DND5E.Concentration") : null,
        item.data.components.ritual ? game.i18n.localize("DND5E.Ritual") : null
      )
    }

    else if ( item.type === "equipment" ) {
      props.push(CONFIG.DND5E.equipmentTypes[item.data.armor.type]);
      props.push(labels.armor);
    }

    else if ( item.type === "feat" ) {
      props.push(labels.featType);
    }

    // Action type
    if ( item.data.actionType ) {
      props.push(CONFIG.DND5E.itemActionTypes[item.data.actionType]);
    }

    // Action usage
    if ( (item.type !== "weapon") && item.data.activation && !isObjectEmpty(item.data.activation) ) {
      props.push(
        labels.activation,
        labels.range,
        labels.target,
        labels.duration
      )
    }
    return props.filter(p => !!p);
  }

  /* -------------------------------------------- */

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
	static titleupdate (){
		//CHECK FOR TITLE CHANGE
		if(document.getElementById("titlename") != undefined){
			if(document.getElementById("titleselected1").selected){
				document.getElementById("titleselect").title = document.getElementById("title1Text").value
				document.getElementById("titlename").title = document.getElementById("title1Text").value
			}
			else if(document.getElementById("titleselected2").selected){
				document.getElementById("titleselect").title = document.getElementById("title2Text").value
				document.getElementById("titlename").title = document.getElementById("title2Text").value
			}
			else if(document.getElementById("titleselected3").selected){
				document.getElementById("titleselect").title = document.getElementById("title3Text").value
				document.getElementById("titlename").title = document.getElementById("title3Text").value
			}
		}
	}
    getData() {
        const data = super.getData();
        //settings
        data.noheropoints = game.settings.get('darksheet', 'noheropoints'); //
        data.slotbasedinventory = game.settings.get('darksheet', 'slotbasedinventory'); //
        data.hidesettings = game.settings.get('darksheet', 'hidesettings'); //
        data.hidechecks = game.settings.get('darksheet', 'hidechecks'); //
        data.hideammodie = game.settings.get('darksheet', 'hideammodie'); //
        data.hidenotches = game.settings.get('darksheet', 'hidenotches'); //
        data.disablefragility = game.settings.get('darksheet', 'disablefragility'); //
        data.disabletemper = game.settings.get('darksheet', 'disabletemper'); //
        data.disableitemquality = game.settings.get('darksheet', 'disableitemquality'); //
        data.hidedamageac = game.settings.get('darksheet', 'hidedamageac'); //
		data.savecantrips = game.settings.get('darksheet', 'savecantrips'); //
		data.silverstandard = game.settings.get('darksheet', 'silverstandard'); //
		data.globalTemp = game.settings.get('darksheet', 'globalTemp'); //
		data.globalRegMagic = game.settings.get('darksheet', 'globalRegMagic'); //

        return data;
    }
	
    activateListeners(html) {
        super.activateListeners(html);
		
		html.find('.removewoundbutton').click(async event => {
		   //update the actor
		   let newwound = parseFloat(this.actor.data.data.attributes.maxwounds.value) - 1;
		   let newtext = "";
		   let button = event.toElement.id;
		   let target = 'data.attributes.darksheet-wounds.'+ button;
		   let newcheck = false;
		   switch(button){
			   case "wound1": this.actor.update({'data.attributes.darksheet-wounds.wound1': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound1treated.value': newcheck,}); break;
			   case "wound2": this.actor.update({'data.attributes.darksheet-wounds.wound2': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound2treated.value': newcheck,}); break;
			   case "wound3": this.actor.update({'data.attributes.darksheet-wounds.wound3': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound3treated.value': newcheck,}); break;
			   case "wound4": this.actor.update({'data.attributes.darksheet-wounds.wound4': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound4treated.value': newcheck,}); break;
			   case "wound5": this.actor.update({'data.attributes.darksheet-wounds.wound5': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound5treated.value': newcheck,}); break;
			   case "wound6": this.actor.update({'data.attributes.darksheet-wounds.wound6': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound61treated.value': newcheck,}); break;
			   case "wound7": this.actor.update({'data.attributes.darksheet-wounds.wound7': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound7treated.value': newcheck,}); break;
			   case "wound8": this.actor.update({'data.attributes.darksheet-wounds.wound8': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound8treated.value': newcheck,}); break;
			   case "wound9": this.actor.update({'data.attributes.darksheet-wounds.wound9': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound9treated.value': newcheck,}); break;
			   case "wound10": this.actor.update({'data.attributes.darksheet-wounds.wound10': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound10treated.value': newcheck,}); break;
			   case "wound11": this.actor.update({'data.attributes.darksheet-wounds.wound11': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound11treated.value': newcheck,}); break;
			   case "wound12": this.actor.update({'data.attributes.darksheet-wounds.wound12': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound12treated.value': newcheck,}); break;
			   case "wound13": this.actor.update({'data.attributes.darksheet-wounds.wound13': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound13treated.value': newcheck,}); break;
			   case "wound14": this.actor.update({'data.attributes.darksheet-wounds.wound14': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound14treated.value': newcheck,}); break;
			   case "wound15": this.actor.update({'data.attributes.darksheet-wounds.wound15': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound15treated.value': newcheck,}); break;
			   case "wound16": this.actor.update({'data.attributes.darksheet-wounds.wound16': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound16treated.value': newcheck,}); break;
			   case "wound17": this.actor.update({'data.attributes.darksheet-wounds.wound17': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound17treated.value': newcheck,}); break;
			   case "wound18": this.actor.update({'data.attributes.darksheet-wounds.wound18': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound18treated.value': newcheck,}); break;
			   case "wound19": this.actor.update({'data.attributes.darksheet-wounds.wound19': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound19treated.value': newcheck,}); break;
			   case "wound20": this.actor.update({'data.attributes.darksheet-wounds.wound20': newtext,'data.attributes.maxwounds.value': newwound,'data.attributes.darksheet-wounds.wound20treated.value': newcheck,}); break;
		   }
		})
		html.find('.addwoundbutton').click(async event => {
            event.preventDefault();
			if(this.actor.data.data.attributes.maxwounds.value >= 20){
				ui.notifications.warn("Darksheet | You can not have more than 20 wounds.");

			}
			else{
				let newwound = parseFloat(this.actor.data.data.attributes.maxwounds.value) + 1;
				this.actor.update({
					'data.attributes.maxwounds.value': newwound
				});
			}
        });
        html.find('.exhaustioncalc').click(async event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustion.value;
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
            let exhaustion1 = false;
            let exhaustion2 = false;
            let exhaustion3 = false;
            let exhaustion4 = false;
            let exhaustion5 = false;
            if (newexhaustion === 1) {
                exhaustion1 = true;
            } else if (newexhaustion === 2) {
                exhaustion2 = true;
            } else if (newexhaustion === 3) {
                exhaustion3 = true;
            } else if (newexhaustion === 4) {
                exhaustion4 = true;
            } else if (newexhaustion === 5) {
                exhaustion5 = true;
            }

            this.actor.update({
                'data.attributes.newexhaustion': newexhaustion,
                'data.status.isExhaustion1': exhaustion1,
                'data.status.isExhaustion2': exhaustion2,
                'data.status.isExhaustion3': exhaustion3,
                'data.status.isExhaustion4': exhaustion4,
                'data.status.isExhaustion5': exhaustion5,
            });
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
        html.find('.applybutton').click(async event => {
            event.preventDefault();
            this.actor.update({
                'data.color.custom.color': $('input[name="data.color.custom.color"]').val(),
                'data.color.custom.textcolor': $('input[name="data.color.custom.textcolor"]').val(),
            });
            this.render();
        });

        html.find('.darksheetbuttonplus').click(async event => {
            event.preventDefault();
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
            let name = darkitem.name;
            let notches = darkitem.data.flags.darksheet.item.notches;
            let fragility = darkitem.data.flags.darksheet.item.fragility;
            let maxnotches = darkitem.data.flags.darksheet.item.maxnotches;
            let basenotchdamage;
            let temper = darkitem.data.flags.darksheet.item.temper;
            if (temper === "" || temper === undefined) {
                temper = 1;
            } else if (temper === "Pure") {
                temper = 0.5;
            } else if (temper === "Royal") {
                temper = 0.25;
            } else if (temper === "Astral") {
                temper = 0.125;
            }
            if (game.settings.get('darksheet', 'disabletemper')) {
                temper = 1;
            }
            if (darkitem.name.includes("[Shattered]")) {
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
                } else if (notches >= parseInt(darkitem.data.flags.darksheet.item.fragility) && game.settings.get('darksheet', 'disablefragility') == false) {

                    if (game.settings.get('darksheet', 'destroyshatter')) {
                        let newname = "[Shattered] " + darkitem.name;
                        this.actor.updateEmbeddedEntity('Item', {
                            _id: darkitem.data._id,
                            'name': newname
                        });
                    } else {
                        this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                    }
					ui.notifications.notify("<b>Your " + name + " has shattered</b>");
                    console.log(name + " should be destroyed");
                    let content = `
						<div class="dnd5e chat-card item-card">
							<header class="card-header flexrow">
								<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/> <h3>${this.actor.name}'s </h3>
							</header>
							<label style="font-size: 14px;">${name} just shattered</label>
						</div>`;
                    let rollWhisper = null;
                    let rollBlind = false;
                    let rollMode = game.settings.get("core", "rollMode");
                    if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
                    if (rollMode === "blindroll") rollBlind = true;
                    ChatMessage.create({
                        user: game.user._id,
                        content: content,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },
                        sound: CONFIG.sounds.dice,
                    });

                }

            }
            //VALUE CALCULATION==========================================
            let quality = darkitem.data.flags.darksheet.item.quality;
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
            this.actor.updateEmbeddedEntity('Item', {
                _id: darkitem.data._id,
                'flags.darksheet.item.quality': quality
            });

            if (darkitem.type === "equipment") { //ARMOR CALCULATION==========================================
                let AC = darkitem.data.data.armor.value;
                if (Number.isInteger(notches)) {
                    let newAC = AC - 1;
                    if (newAC <= 0) {
                        newAC = 0
                    };
                    if (Math.floor(notches) === 1) {
                        basenotchdamage = AC;
                    }
                    if (newAC >= basenotchdamage) {
                        newAC = basenotchdamage
                    }
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.armor.value': newAC
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });
                    if (newAC <= 1) { //SHATTER IF AC 1 OR SLOWER
                        if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                            if (game.settings.get('darksheet', 'destroyshatter')) {
                                let newname = "[Shattered] " + darkitem.name;
                                this.actor.updateEmbeddedEntity('Item', {
                                    _id: darkitem.data._id,
                                    'name': newname
                                });
                            } else {
                                this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                            }
                        }
                    }
                }
            }
            if (darkitem.type === "tool") {
                this.actor.updateEmbeddedEntity('Item', {
                    _id: darkitem.data._id,
                    'data.notchpen': notches
                });
            }
            if (darkitem.type === "weapon") { //WEAPON CALCULATION==========================================
                let updatedamage;
                //DAMAGE CALCULATION PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                if (Number.isInteger(notches)) {
                    let damage1 = darkitem.data.data.damage.parts[0][0];
                    //			console.log(damage1);
                    let dicenumber = damage1.charAt(0); //2
                    let d = damage1.charAt(1); //d 
                    let damage = damage1.charAt(2) + damage1.charAt(3); //6
                    let mod = " + @mod";

                    let weapondamage;
                    if (darkitem.data.data.damage.currentweapondamage) {
                        weapondamage = darkitem.data.data.damage.currentweapondamage;
                    } else {
                        weapondamage = dicenumber + d + damage; //"2d6 "
                    }
                    //			console.log("Darksheet-Dev:" + dicenumber, d, damage);
                    //			console.log("Darksheet-Dev:" +weapondamage);
					if(weapondamage[weapondamage.length -1] == " ")
					weapondamage = weapondamage.substring(0, weapondamage.length -1);
                    let baseweapondamage = darkitem.data.data.damage.baseweapondamage;
                    if (baseweapondamage === "") {
                        baseweapondamage = weapondamage;
                        this.actor.updateEmbeddedEntity('Item', {
                            _id: darkitem.data._id,
                            'data.damage.baseweapondamage': baseweapondamage
                        });
                    }

                    //WEAPONDAMAGE  PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    switch (weapondamage) {
                        //CASES FOR 2 DAMAGE DICE
                        case "2d20":
                            weapondamage = "1d20 + 1d12";
                            break;
                        case "1d20 + 1d12":
                            weapondamage = "2d12";
                            break;
                        case "2d12":
                            weapondamage = "1d12 + 1d10";
                            break;
                        case "1d12 + 1d10":
                            weapondamage = "2d10";
                            break;
                        case "2d10":
                            weapondamage = "1d10 + 1d6";
                            break;
                        case "1d10 + 1d6":
                            weapondamage = "2d6";
                            break;
                        case "2d6":
                            weapondamage = "1d6 + 1d4";
                            break;
                        case "1d6 + 1d4":
                            weapondamage = "2d4";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "2d4":
                            weapondamage = "1d4 + 1";
                            break;
                        case "1d4 + 1":
                            weapondamage = "2";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "2":
                            weapondamage = "(1)";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                                if (game.settings.get('darksheet', 'destroyshatter')) {
                                    let newname = "[Shattered] " + darkitem.name;
                                    this.actor.updateEmbeddedEntity('Item', {
                                        _id: darkitem.data._id,
                                        'name': newname
                                    });
                                } else {
                                    this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                                }
                            }
                            break;
                            //CASES FOR single dice damage
                        case "1d20":
                            weapondamage = "1d12";
                            break;
                        case "1d12":
                            weapondamage = "1d10";
                            break;
                        case "1d10":
                            weapondamage = "1d8";
                            break;
                        case "1d8":
                            weapondamage = "1d6";
                            break;
                        case "1d6":
                            weapondamage = "1d4";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "1d4":
                            weapondamage = "1";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                                if (game.settings.get('darksheet', 'destroyshatter')) {
                                    let newname = "[Shattered] " + darkitem.name;
                                    this.actor.updateEmbeddedEntity('Item', {
                                        _id: darkitem.data._id,
                                        'name': newname
                                    });
                                } else {
                                    this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                                }
                            }
                            break;
                        default:
                            // code block
                    }
                    updatedamage = weapondamage + mod;
                    const parts = duplicate(darkitem.data.data.damage.parts);
                    parts[0][0] = updatedamage;
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.parts': parts
                    });
                    this.render();

                    //UPDATE WEAPON DAMAGE ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.currentweapondamage': weapondamage
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });

                }
            }
            this.actor.updateEmbeddedEntity('Item', {
                _id: darkitem.data._id,
                'flags.darksheet.item.notches': notches
            });
            this.render();
        });
        html.find('.darksheetbutton-').click(async event => {
            event.preventDefault();
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
            let basenotchdamage = darkitem.data.data.damage.basenotchdamage;
            let notches = darkitem.data.flags.darksheet.item.notches;
            let newnotches = notches - 1;
            let updatedamage;
            if (notches === undefined) {
                newnotches = "";
            }
            if (newnotches <= 0) {
                newnotches = "";
            }
            if (darkitem.name.includes("[Shattered]")) {
                ui.notifications.warn("This item is [Shattered], you need to rename it first...");
            } else {
                this.actor.updateEmbeddedEntity('Item', {
                    _id: darkitem.data._id,
                    'flags.darksheet.item.notches': newnotches
                });
                if (darkitem.type === "equipment") { //ARMOR CALCULATION==========================================
                    let AC = darkitem.data.data.armor.value;
                    let newAC = AC;
                    if (notches > basenotchdamage) { //IF NOTCHES AREN'T SMALLER THAN THE BASENOTCHES
                    } else {
                        newAC++;
                    }
                    if (newAC >= basenotchdamage) {
                        newAC = basenotchdamage
                    }
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.armor.value': newAC
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });
                }
                if (darkitem.type === "tool") {
                    if (basenotchdamage === undefined || basenotchdamage === "") {
                        basenotchdamage = newnotches;
                    }
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.notchpen': newnotches
                    });
                }
                //DAMAGE CALCULATION MINUS-------------------------------------------------------------------
                if (darkitem.type === "weapon") {
                    let damage1 = darkitem.data.data.damage.parts[0][0];
                    //			console.log(damage1);
                    let dicenumber = damage1.charAt(0); //2
                    let d = damage1.charAt(1); //d 
                    let damage = damage1.charAt(2) + damage1.charAt(3); //6
                    let mod = " + @mod";
                    let weapondamage;
                    if (darkitem.data.data.damage.currentweapondamage) {
                        weapondamage = darkitem.data.data.damage.currentweapondamage;
                    } else {
                        weapondamage = dicenumber + d + damage; //"2d6 "
                    }
                    //			console.log("Darksheet-Dev:" + dicenumber, d, damage);
                    //			console.log("Darksheet-Dev:" +weapondamage);

                    let baseweapondamage = darkitem.data.data.damage.baseweapondamage;
                    if (darkitem.data.data.damage.baseweapondamage === undefined) {
                        baseweapondamage = weapondamage;
                        this.actor.updateEmbeddedEntity('Item', {
                            _id: darkitem.data._id,
                            'data.damage.baseweapondamage': baseweapondamage
                        });
                    }

                    if (weapondamage === baseweapondamage) {
                        weapondamage = baseweapondamage;
                    } else if (Math.floor(notches) > basenotchdamage) { //More notches than basenotches?
                    } else {
                        switch (weapondamage) {
                            //CASES FOR 2 DAMAGE DICE
                            case "2":
                                weapondamage = "1d4 + 1";
                                break;
                            case "1d4 + 1":
                                weapondamage = "2d4";
                                break;
                            case "2d4":
                                weapondamage = "1d6 + 1d4";
                                break;
                            case "1d6 + 1d4":
                                weapondamage = "2d6";
                                break;
                            case "2d6":
                                weapondamage = "1d8 + 1d6";
                                break;
                            case "1d8 + 1d6":
                                weapondamage = "2d8";
                                break;
                            case "2d8":
                                weapondamage = "1d10 + 1d8";
                                break;
                            case "1d10 + 1d8":
                                weapondamage = "2d10";
                                break;
                            case "2d10":
                                weapondamage = "1d12 + 1d10";
                                break;
                            case "1d12 + 1d10":
                                weapondamage = "2d12";
                                break;
                            case "2d12":
                                weapondamage = "1d20 + 1d12";
                                break;
                            case "1d20 + 1d12":
                                weapondamage = "2d20";
                                break;
                                //CASES FOR SINGLE DAMAGEDICE
                            case "1":
                                weapondamage = "1d4";
                                break;
                            case "(1)":
                                weapondamage = "2";
                                break;
                            case "1d4":
                                weapondamage = "1d6";
                                break;
                            case "1d6":
                                weapondamage = "1d8";
                                break;
                            case "1d8":
                                weapondamage = "1d10";
                                break;
                            case "1d10":
                                weapondamage = "1d12";
                                break;
                            case "1d12":
                                weapondamage = "1d20";
                                break;
                            default:
                                if(darkitem.data.data.damage.baseweapondamage) weapondamage = darkitem.data.data.damage.baseweapondamage;
                                break;
                        }
                    }
                    updatedamage = weapondamage + mod;
                    const parts = duplicate(darkitem.data.data.damage.parts);
                    parts[0][0] = updatedamage;
                    if (newnotches <= 0) {
                        basenotchdamage = "";
                    }
                    if (darkitem.name.includes("[Shattered]")) {
                        newnotches = notches
                    }
                    //NOTCH CALCULATION MINUS-------------------------------------------------------------------
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.parts': parts
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.currentweapondamage': weapondamage
                    }); //Weapon Damage On Name
                }
            }
            this.render();
        });
        html.find('.ammodice').click(async event => {
            event.preventDefault(); // Rolling table, from best to worst
            const rollings = ['d12', 'd10', 'd8', 'd6', 'd4', 'd2', '1', '']; // Getting item
            let item = this.actor.items.get(($(event.currentTarget).parents('[data-item-id]').attr("data-item-id")));
            // Seeting and creating chatMessage
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
            let title = `<header><h3>${this.actor.data.name} rolls ${this.actor.data.data.attributes.adress} ammodie for ${darkitem.name}<h3></header>`;
            let roll = new Roll('@ammodie', {
                ammodie: darkitem.data.flags.darksheet.item.ammodie
            }).roll();
            let rollWhisper = null;
            let rollMode = game.settings.get("core", "rollMode");
            let currentdie = darkitem.data.flags.darksheet.item.ammodie;
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
                this.actor.updateEmbeddedEntity('Item', {
                    _id: darkitem.data._id,
                    'flags.darksheet.item.ammodie': newammodie
                });
                this.render();
            }
        });
        html.find('.randomnotch').click(async event => {
            let array = this.actor.items.filter(i => i.type !== "feat" && i.type !== "class" && i.type !== "spell");
            let numberino = 0;
            let randomItem = array[Math.floor(Math.random(numberino) * array.length)];
            let randomID = randomItem.id;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', randomID);
            let name = darkitem.name;
			
			let notches = 0;
			let fragility = "";
			let maxnotches = "";
			let temper = "";
			let quality = "";
			
			if(darkitem.data.flags.darksheet != undefined){
				if(darkitem.data.flags.darksheet.item.notches != undefined) notches = darkitem.data.flags.darksheet.item.notches;
				if(darkitem.data.flags.darksheet.item.fragility != undefined) fragility = darkitem.data.flags.darksheet.item.fragility;
				if(darkitem.data.flags.darksheet.item.maxnotches != undefined) maxnotches = darkitem.data.flags.darksheet.item.maxnotches;
				if(darkitem.data.flags.darksheet.item.temper != undefined) temper = darkitem.data.flags.darksheet.item.temper;
				if(darkitem.data.flags.darksheet.item.quality != undefined) quality = darkitem.data.flags.darksheet.item.quality;
			}

            let basenotchdamage;


            if (temper === "" || temper === undefined) {
                temper = 1;
            } else if (temper === "Pure") {
                temper = 0.5;
            } else if (temper === "Royal") {
                temper = 0.25;
            } else if (temper === "Astral") {
                temper = 0.125;
            }
            if (game.settings.get('darksheet', 'disabletemper')) {
                temper = 1;
            }
            if (darkitem.name.includes("[Shattered]")) {
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
                } else if (notches >= fragility && game.settings.get('darksheet', 'disablefragility') == false) {

                    if (game.settings.get('darksheet', 'destroyshatter')) {
                        let newname = "[Shattered] " + darkitem.name;
                        this.actor.updateEmbeddedEntity('Item', {
                            _id: darkitem.data._id,
                            'name': newname
                        });
                    } else {
                        this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                    }
					ui.notifications.notify("<b>Your " + name + " has shattered</b>");
                    console.log(name + " should be destroyed");
                    let content = `
						<div class="dnd5e chat-card item-card">
							<header class="card-header flexrow">
								<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/> <h3>${this.actor.name}'s </h3>
								</br>
							</header>
							<label style="font-size: 14px;">${name} just shattered</label>
						</div>`;
                    let rollWhisper = null;
                    let rollBlind = false;
                    let rollMode = game.settings.get("core", "rollMode");
                    if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
                    if (rollMode === "blindroll") rollBlind = true;
                    ChatMessage.create({
                        user: game.user._id,
                        content: content,
                        speaker: {
                            actor: this.actor._id,
                            token: this.actor.token,
                            alias: this.actor.name
                        },
                        sound: CONFIG.sounds.dice,
                    });

                }

            }
            //VALUE CALCULATION==========================================
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
            this.actor.updateEmbeddedEntity('Item', {
                _id: darkitem.data._id,
                'flags.darksheet.item.quality': quality
            });

            if (darkitem.type == "equipment") { //ARMOR CALCULATION==========================================
                let AC = darkitem.data.data.armor.value;
                if (Number.isInteger(notches)) {
                    let newAC = AC - 1;
                    if (newAC <= 0) {
                        newAC = 0
                    };
                    if (Math.floor(notches) === 1) {
                        basenotchdamage = AC;
                    }
                    if (newAC >= basenotchdamage) {
                        newAC = basenotchdamage
                    }
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.armor.value': newAC
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });
                    if (newAC <= 1) { //SHATTER IF AC 1 OR SLOWER
                        if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                            if (game.settings.get('darksheet', 'destroyshatter')) {
                                let newname = "[Shattered] " + darkitem.name;
                                this.actor.updateEmbeddedEntity('Item', {
                                    _id: darkitem.data._id,
                                    'name': newname
                                });
                            } else {
                                this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                            }
                        }
                    }
                }
            }
            if (darkitem.type === "tool") {
                this.actor.updateEmbeddedEntity('Item', {
                    _id: darkitem.data._id,
                    'data.notchpen': notches
                });
            }
            if (darkitem.type === "weapon") { //WEAPON CALCULATION==========================================
                let updatedamage;
                //DAMAGE CALCULATION PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                if (Number.isInteger(notches)) {
                    let damage1 = darkitem.data.data.damage.parts[0][0];
                    //			console.log(damage1);
                    let dicenumber = damage1.charAt(0); //2
                    let d = damage1.charAt(1); //d 
                    let damage = damage1.charAt(2) + damage1.charAt(3); //6
                    let mod = " + @mod";

                    let weapondamage;
                    if (darkitem.data.data.damage.currentweapondamage) {
                        weapondamage = darkitem.data.data.damage.currentweapondamage;
                    } else {
                        weapondamage = dicenumber + d + damage; //"2d6 "
                    }
                    //			console.log("Darksheet-Dev:" + dicenumber, d, damage);
                    //			console.log("Darksheet-Dev:" +weapondamage);

                    let baseweapondamage = darkitem.data.data.damage.baseweapondamage;
                    if (baseweapondamage === "") {
                        baseweapondamage = weapondamage;
                        this.actor.updateEmbeddedEntity('Item', {
                            _id: darkitem.data._id,
                            'data.damage.baseweapondamage': baseweapondamage
                        });
                    }

                    //WEAPONDAMAGE  PLUS++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    switch (weapondamage) {
                        //CASES FOR 2 DAMAGE DICE
                        case "2d20":
                            weapondamage = "1d20 + 1d12";
                            break;
                        case "1d20 + 1d12":
                            weapondamage = "2d12";
                            break;
                        case "2d12":
                            weapondamage = "1d12 + 1d10";
                            break;
                        case "1d12 + 1d10":
                            weapondamage = "2d10";
                            break;
                        case "2d10":
                            weapondamage = "1d10 + 1d6";
                            break;
                        case "1d10 + 1d6":
                            weapondamage = "2d6";
                            break;
                        case "2d6":
                            weapondamage = "1d6 + 1d4";
                            break;
                        case "1d6 + 1d4":
                            weapondamage = "2d4";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "2d4":
                            weapondamage = "1d4 + 1";
                            break;
                        case "1d4 + 1":
                            weapondamage = "2";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "2":
                            weapondamage = "(1)";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                                if (game.settings.get('darksheet', 'destroyshatter')) {
                                    let newname = "[Shattered] " + darkitem.name;
                                    this.actor.updateEmbeddedEntity('Item', {
                                        _id: darkitem.data._id,
                                        'name': newname
                                    });
                                } else {
                                    this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                                }
                            }
                            break;
                            //CASES FOR single dice damage
                        case "1d20":
                            weapondamage = "1d12";
                            break;
                        case "1d12":
                            weapondamage = "1d10";
                            break;
                        case "1d10":
                            weapondamage = "1d8";
                            break;
                        case "1d8":
                            weapondamage = "1d6";
                            break;
                        case "1d6":
                            weapondamage = "1d4";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            break;
                        case "1d4":
                            weapondamage = "1";
                            this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.damage.basenotchdamage': notches
                            });
                            if (game.settings.get('darksheet', 'shatterwhen1') && game.settings.get('darksheet', 'disablefragility') == false && quality === "scarred") {
                                if (game.settings.get('darksheet', 'destroyshatter')) {
                                    let newname = "[Shattered] " + darkitem.name;
                                    this.actor.updateEmbeddedEntity('Item', {
                                        _id: darkitem.data._id,
                                        'name': newname
                                    });
                                } else {
                                    this.actor.deleteEmbeddedEntity("OwnedItem", darkitem._id);
                                }
                            }
                            break;
                        default:
                            // code block
                    }
                    updatedamage = weapondamage + mod;
                    const parts = duplicate(darkitem.data.data.damage.parts);
                    parts[0][0] = updatedamage;
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.parts': parts
                    });
                    this.render();

                    //UPDATE WEAPON DAMAGE ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.currentweapondamage': weapondamage
                    });
                    this.actor.updateEmbeddedEntity('Item', {
                        _id: darkitem.data._id,
                        'data.damage.basenotchdamage': basenotchdamage
                    });

                }
            }
            this.actor.updateEmbeddedEntity('Item', {
                _id: darkitem.data._id,
                'flags.darksheet.item.notches': notches
            });
			ui.notifications.notify("Your item " + darkitem.name + " gained a notch, it now has a total of [" + notches + "] Notches.");
            this.render();
        });
        /*LOOK FOR Stresscheckbox*/
        html.find('.stressroll').click(async event => {
            event.preventDefault();
			if(!game.settings.get('darksheet', 'afflictionFromComp')){
				// Rolling table, from best to worst
				let table = game.tables.entities.find(t => t.data.name === "Afflictions");
				if(table == undefined){
					ui.notifications.warn("Darksheet | You need to import or create a 'Afflictions' Table to roll from");
				}
				else{table.draw();}
			}
			else{
				let afflictions = game.packs.get("darksheet.afflictions").index;
				const rndInt = Math.floor(Math.random() * game.packs.get("darksheet.afflictions").index.size) - 1;
				let ThisAffliction = game.packs.get("darksheet.afflictions").index.contents[rndInt];
				let AfflictionID = game.packs.get("darksheet.afflictions").index.contents[rndInt]._id;
				let AfflictionName = game.packs.get("darksheet.afflictions").index.contents[rndInt].name.replace("Affliction: ", "");
				ChatMessage.create({
					user: game.user._id,
					content: "Gained an @Compendium[darksheet.afflictions."+AfflictionID+"]",
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
				//FIGURE OUT WHICH AFFLICTION TO Set
				if(!this.actor.data.data.attributes.break1){
					this.actor.update({
                    'data.attributes.break1': true,
					'data.attributes.affliction1.value': AfflictionName
					});
				}
				else if(!this.actor.data.data.attributes.break2){
					this.actor.update({
                    'data.attributes.break2': true,
					'data.attributes.affliction2.value': AfflictionName
					});
				}
				else if(this.actor.data.data.attributes.break3){
					this.actor.update({
                    'data.attributes.break2': true,
					'data.attributes.affliction2.value': AfflictionName
					});
				}
				const itemData = await game.packs.get("darksheet.afflictions").index.get(AfflictionID);
				this.actor.createEmbeddedDocuments("Item", [itemData]);	
				//this.actor.items.document.createOwnedItem(itemData, {parent: this.actor});
				//await this.actor.createOwnedItem(ThisAffliction);
			}
			
			
        });
        html.find('.darksheetbuttonHDplus').click(async event => {
            event.preventDefault();
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
			//console.log(darkitem);
			let used = darkitem.data.data.hitDiceUsed + 1;
			//INVALID VALUE CHECK
			if(used > darkitem.data.data.levels){
				used = darkitem.data.data.levels;
			}
			else if(used < 0){
				used = 0;
			}
			this.actor.updateEmbeddedEntity('Item', {
            _id: darkitem.data._id,
            'data.hitDiceUsed': used
            });
			
        });
        html.find('.darksheetbuttonHDmin').click(async event => {
            event.preventDefault();
            const itemID = event.currentTarget.closest('.item').dataset.itemId;
            let darkitem = this.actor.getEmbeddedEntity('OwnedItem', itemID);
			console.log(darkitem);
			let used = darkitem.data.data.hitDiceUsed - 1;
			
			//INVALID VALUE CHECK
			if(used > darkitem.data.data.levels){
				used = darkitem.data.data.levels;
			}
			else if(used < 0){
				used = 0;
			}
			
			this.actor.updateEmbeddedEntity('Item', {
                                _id: darkitem.data._id,
                                'data.hitDiceUsed': used
            });
        });

        html.find('.minusspellslot-spell1').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell1.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell1.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell2').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell2.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell2.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell3').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell3.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell3.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell4').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell4.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell4.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell5').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell5.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell5.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell6').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell2.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell6.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell7').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell7.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell7.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell8').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell8.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell8.value': actor
                });
            }
        });
        html.find('.minusspellslot-spell9').click(async event => {
            event.preventDefault();
            let actor = this.actor.data.data.spells.spell9.value;
            if (actor >= 1) {
                actor -= 1;
                this.actor.update({
                    'data.spells.spell9.value': actor
                });
            }
        });
		html.find('.minusspellslot-pact').click(async event => {
            event.preventDefault();
            let spellamount = this.actor.data.data.spells.pact.value;
            if (spellamount > 0) {
                spellamount -= 1;
                this.actor.update({
                    'data.spells.pact.value': spellamount
                });
            }
        });
		//============================================================================================PLUS
        html.find('.plusspellslot-spell1').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell1.max;;
            let spellamount = this.actor.data.data.spells.spell1.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell1.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell2').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell2.max;;
            let spellamount = this.actor.data.data.spells.spell2.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell2.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell3').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell3.max;;
            let spellamount = this.actor.data.data.spells.spell3.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell3.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell4').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell4.max;;
            let spellamount = this.actor.data.data.spells.spell4.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell4.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell5').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell5.max;;
            let spellamount = this.actor.data.data.spells.spell5.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell5.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell6').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell6.max;;
            let spellamount = this.actor.data.data.spells.spell6.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell6.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell7').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell7.max;;
            let spellamount = this.actor.data.data.spells.spell7.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell7.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell8').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell8.max;;
            let spellamount = this.actor.data.data.spells.spell8.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell8.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-spell9').click(async event => {
            event.preventDefault();
            let maxamount = this.actor.data.data.spells.spell9.max;;
            let spellamount = this.actor.data.data.spells.spell9.value;
            if (spellamount < maxamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.spell9.value': spellamount
                });
            }
        });
        html.find('.plusspellslot-pact').click(async event => {
            event.preventDefault();
            let pactamount = this.actor.data.data.spells.pact.max;
            let spellamount = this.actor.data.data.spells.pact.value;
            if (spellamount < pactamount) {
                spellamount += 1;
                this.actor.update({
                    'data.spells.pact.value': spellamount
                });
            }
        });
        /*LOOK FOR BURNOUTDIE*/
        html.find('.burnoutdie').click(async event => {
            event.preventDefault();

            // Rolling table, from best to worst
            const rollings = ['12', '10', '8', '6', '4'];
            // Value of the burnoutdice
            let burnoutdie = this.actor.data.data.attributes.burnout.value;
            // find the table
            let table = game.tables.entities.find(t => t.data.name === "Burnout Consequence");
			if(table == undefined){
				ui.notifications.warn("Darksheet | You need to import or create a 'Burnout Consequence' Table to roll from");
				return;
			}
            // burnoutsettings
            let bsettings = this.actor.data.data.attributes.burnout.value
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
            let result = await table.roll();
			//NEW BURNOUT DIE
			if(burnoutARegion == 4)
				var newBurnOutDie = "";
			else
				var newBurnOutDie = "-> d" + rollings[regionmodz +1];

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
						<h3>Burnoutdice(${rollcona}        html.find('.burnoutdie').click(async event => {${newBurnOutDie}): </h3>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px;">${roll.result}</h3>
					</header>
					</br>
					<h3 style="color: #ff0000;text-shadow: 0 0 2px; text-align: center;">${result.results[0].data.text}</h3>
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
                if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
					    this.actor.update({'data.attributes.burnout.value': rollings[new_burnoutdie]});
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
        //AUTOMATIC EXHAUSTION CALCULATION
        html.find('.exhaustioncalc').click(async event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustion.value;
			let closedwounds = this.actor.data.data.attributes.wounds.value;
			let maxwounds = 0;
			if(this.actor.data.data.attributes.maxwounds != null){
				maxwounds = this.actor.data.data.attributes.maxwounds.value;
			}
			let woundexhaustion = maxwounds - closedwounds;
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
			//addding wound exhaustion
			newexhaustion += woundexhaustion;
            this.actor.data.data.attributes.newexhaustion = newexhaustion;
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);
            this.render();
        });
        html.find('.staminacheck').click(async event => {
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
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
                this.actor.update({
                    'data.attributes.saturation.value': food
                });
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
                this.actor.update({
                    'data.attributes.thirst.value': water
                });
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
                this.actor.update({
                    'data.attributes.fatigue.value': fatigue
                });
                this.render();
            }
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustion.value;
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
            this.actor.update({
                'data.attributes.newexhaustion': newexhaustion
            });
            this.render();
        });

        html.find('.exhaustionstatus').click(async event => {
            event.preventDefault();
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustion.value;
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
			//adding wound exhaustion
			let closedwounds = this.actor.data.data.attributes.wounds.value;
			let maxwounds = 0;
			if(this.actor.data.data.attributes.maxwounds != null){
				maxwounds = this.actor.data.data.attributes.maxwounds.value;
			}
			let woundexhaustion = maxwounds - closedwounds;
			newexhaustion += woundexhaustion;
            console.log("(DarkSheet): New Exhaustion: " + this.actor.data.data.attributes.newexhaustion);

            let exhaustion1 = false;
            let exhaustion2 = false;
            let exhaustion3 = false;
            let exhaustion4 = false;
            let exhaustion5 = false;
            if (newexhaustion === 1) {
                exhaustion1 = true;
            } else if (newexhaustion === 2) {
                exhaustion2 = true;
            } else if (newexhaustion === 3) {
                exhaustion3 = true;
            } else if (newexhaustion === 4) {
                exhaustion4 = true;
            } else if (newexhaustion === 5) {
                exhaustion5 = true;
            }

            this.actor.update({
                'data.status.isExhaustion1': exhaustion1
            });
            this.actor.update({
                'data.status.isExhaustion2': exhaustion2
            });
            this.actor.update({
                'data.status.isExhaustion3': exhaustion3
            });
            this.actor.update({
                'data.status.isExhaustion4': exhaustion4
            });
            this.actor.update({
                'data.status.isExhaustion5': exhaustion5
            });
            this.actor.update({
                'data.attributes.newexhaustion': newexhaustion
            });
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
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
            if (rollMode === "blindroll") rollBlind = true;
			if (newexhaustion === 0) {
				ui.notifications.notify("You don't have any exhaustion.");
			}
            else if (newexhaustion === 1) {
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

        html.find('.deathsaveroll').click(async event => {
            event.preventDefault();
            let result = ["You fail two death saving throws.", "You fail one death saving throw.", "No change.", "You regain 1 hit point."]
            let finalresult = 0;
            let deathsavevalue = 0;
            if (this.actor.data.data.attributes.deathsave1.value) {
                deathsavevalue++;
            }
            if (this.actor.data.data.attributes.deathsave2.value) {
                deathsavevalue++;
            }
            if (this.actor.data.data.attributes.deathsave3.value) {
                deathsavevalue++;
            }

            let newDSV = deathsavevalue;

            let roll = new Roll(`1d20`).roll().total;
            if (roll <= 1) {
                newDSV = newDSV + 2;
            } else if (roll <= 9) {
                finalresult = 1;
                newDSV++;
            } else if (roll <= 19) {
                finalresult = 2;
            } else if (roll == 20) {
                finalresult = 3;
            }

            if (newDSV === 0) {
                this.actor.update({
                    'data.attributes.deathsave1.value': false
                });
                this.actor.update({
                    'data.attributes.deathsave2.value': false
                });
                this.actor.update({
                    'data.attributes.deathsave3.value': false
                });
            } else if (newDSV === 1) {
                this.actor.update({
                    'data.attributes.deathsave1.value': true
                });
                this.actor.update({
                    'data.attributes.deathsave2.value': false
                });
                this.actor.update({
                    'data.attributes.deathsave3.value': false
                });
            } else if (newDSV === 2) {
                this.actor.update({
                    'data.attributes.deathsave1.value': true
                });
                this.actor.update({
                    'data.attributes.deathsave2.value': true
                });
                this.actor.update({
                    'data.attributes.deathsave3.value': false
                });
            } else if (newDSV >= 2) {
                this.actor.update({
                    'data.attributes.deathsave1.value': true
                });
                this.actor.update({
                    'data.attributes.deathsave2.value': true
                });
                this.actor.update({
                    'data.attributes.deathsave3.value': true
                });
            }

            let content = `
				<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>Death Saving Throw</h3>
					</header>
					</br>
					<h3 style="text-shadow: 0 0 4px; text-align: center;">${result[finalresult]}</h3>
				</div>`;
            let dead = `
				<div style="filter:grayscale(1);" class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
					<header class="card-header flexrow">
						<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
						<h3>${this.actor.data.name} just died</h3>
					</header>
				</div>`;
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
            if (newDSV >= 3) {
                ChatMessage.create({
                    user: game.user._id,
                    content: dead,
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
                this.actor.update({
                    'data.attributes.isdead': true
                });
            }
            this.render();
        });
        //Inspiration
        html.find('.useInspiration').click(async event => {
            event.preventDefault();
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
                this.actor.update({
                    'data.attributes.inspirations.value': val
                });
                this.render();
            }

        });
        //Hero Points
        html.find('.useHeroPoint').click(async event => {
            event.preventDefault();
            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
                this.actor.update({
                    'data.attributes.heropoints.value': val
                });
                this.render();
            }

        });
        // LOOK FOR WOUNDROLL
        html.find('.woundroll').click(async event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Reopening Wounds");
            let wounds = this.actor.data.data.attributes.wounds.value;
			if(wounds == 0){
				ui.notifications.warn("You don't have any CLOSED wounds to reopen.");
				return;
			}
            let i = 0;
            let subtractVal = 0;
			let woundstreated
			let newcheck = false;
			for(let i = 1; i <= 20; i++){
				if(document.getElementById(this.actor._id+"-woundcheck"+[i]).checked){
					//let result = table.roll()
					let roll = new Roll(`1d20`).roll().total;
					let Woundname = "";
					if(document.getElementById(this.actor._id+"-wounddes"+[i]).value != ""){
						Woundname = document.getElementById(this.actor._id+"-wounddes"+[i]).value;
					}
					let epicfail = `
					<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3>Woundroll#${i} : ${Woundname}</h3>
						</header>
						</br>
						<b><i style="color: #ff0000">The wound reopens +1 Exhaustion and you lose a hit die
					</div>`;
					let fail = `
					<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3>Woundroll#${i} : ${Woundname}</h3>
						</header>
						</br>
						<i style="color: #ff0000">The wound reopens + 1 Exhaustion
					</div>`;
					let success = `
					<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<header class="card-header flexrow">
							<img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;"/>
							<h3>Woundroll#${i} : ${Woundname}</h3>
						</header>
						</br>
						The wound remains closed
					</div>`;
					let rollWhisper = null;
					let rollBlind = false;
					let rollMode = game.settings.get("core", "rollMode");
					if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
					   switch(i){
						   case 1: this.actor.update({'data.attributes.darksheet-wounds.wound1treated.value': newcheck,}); break;
						   case 2: this.actor.update({'data.attributes.darksheet-wounds.wound2treated.value': newcheck,}); break;
						   case 3: this.actor.update({'data.attributes.darksheet-wounds.wound3treated.value': newcheck,}); break;
						   case 4: this.actor.update({'data.attributes.darksheet-wounds.wound4treated.value': newcheck,}); break;
						   case 5: this.actor.update({'data.attributes.darksheet-wounds.wound5treated.value': newcheck,}); break;
						   case 6: this.actor.update({'data.attributes.darksheet-wounds.wound61treated.value': newcheck,}); break;
						   case 7: this.actor.update({'data.attributes.darksheet-wounds.wound7treated.value': newcheck,}); break;
						   case 8: this.actor.update({'data.attributes.darksheet-wounds.wound8treated.value': newcheck,}); break;
						   case 9: this.actor.update({'data.attributes.darksheet-wounds.wound9treated.value': newcheck,}); break;
						   case 10: this.actor.update({'data.attributes.darksheet-wounds.wound10treated.value': newcheck,}); break;
						   case 11: this.actor.update({'data.attributes.darksheet-wounds.wound11treated.value': newcheck,}); break;
						   case 12: this.actor.update({'data.attributes.darksheet-wounds.wound12treated.value': newcheck,}); break;
						   case 13: this.actor.update({'data.attributes.darksheet-wounds.wound13treated.value': newcheck,}); break;
						   case 14: this.actor.update({'data.attributes.darksheet-wounds.wound14treated.value': newcheck,}); break;
						   case 15: this.actor.update({'data.attributes.darksheet-wounds.wound15treated.value': newcheck,}); break;
						   case 16: this.actor.update({'data.attributes.darksheet-wounds.wound16treated.value': newcheck,}); break;
						   case 17: this.actor.update({'data.attributes.darksheet-wounds.wound17treated.value': newcheck,}); break;
						   case 18: this.actor.update({'data.attributes.darksheet-wounds.wound18treated.value': newcheck,}); break;
						   case 19: this.actor.update({'data.attributes.darksheet-wounds.wound19treated.value': newcheck,}); break;
						   case 20: this.actor.update({'data.attributes.darksheet-wounds.wound20treated.value': newcheck,}); break;

					   }
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
					   switch(i){
						   case 1: this.actor.update({'data.attributes.darksheet-wounds.wound1treated.value': newcheck,}); break;
						   case 2: this.actor.update({'data.attributes.darksheet-wounds.wound2treated.value': newcheck,}); break;
						   case 3: this.actor.update({'data.attributes.darksheet-wounds.wound3treated.value': newcheck,}); break;
						   case 4: this.actor.update({'data.attributes.darksheet-wounds.wound4treated.value': newcheck,}); break;
						   case 5: this.actor.update({'data.attributes.darksheet-wounds.wound5treated.value': newcheck,}); break;
						   case 6: this.actor.update({'data.attributes.darksheet-wounds.wound61treated.value': newcheck,}); break;
						   case 7: this.actor.update({'data.attributes.darksheet-wounds.wound7treated.value': newcheck,}); break;
						   case 8: this.actor.update({'data.attributes.darksheet-wounds.wound8treated.value': newcheck,}); break;
						   case 9: this.actor.update({'data.attributes.darksheet-wounds.wound9treated.value': newcheck,}); break;
						   case 10: this.actor.update({'data.attributes.darksheet-wounds.wound10treated.value': newcheck,}); break;
						   case 11: this.actor.update({'data.attributes.darksheet-wounds.wound11treated.value': newcheck,}); break;
						   case 12: this.actor.update({'data.attributes.darksheet-wounds.wound12treated.value': newcheck,}); break;
						   case 13: this.actor.update({'data.attributes.darksheet-wounds.wound13treated.value': newcheck,}); break;
						   case 14: this.actor.update({'data.attributes.darksheet-wounds.wound14treated.value': newcheck,}); break;
						   case 15: this.actor.update({'data.attributes.darksheet-wounds.wound15treated.value': newcheck,}); break;
						   case 16: this.actor.update({'data.attributes.darksheet-wounds.wound16treated.value': newcheck,}); break;
						   case 17: this.actor.update({'data.attributes.darksheet-wounds.wound17treated.value': newcheck,}); break;
						   case 18: this.actor.update({'data.attributes.darksheet-wounds.wound18treated.value': newcheck,}); break;
						   case 19: this.actor.update({'data.attributes.darksheet-wounds.wound19treated.value': newcheck,}); break;
						   case 20: this.actor.update({'data.attributes.darksheet-wounds.wound20treated.value': newcheck,}); break;
					   }
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
            	}
			};
            let newexhaustion = 0;
            let temp = this.actor.data.data.attributes.temp;
            let food = this.actor.data.data.attributes.saturation.value;
            let water = this.actor.data.data.attributes.thirst.value;
            let fatigue = this.actor.data.data.attributes.fatigue.value;
            let manualexhaustion = this.actor.data.data.attributes.exhaustion.value;
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
            if (this.actor.data.data.attributes.newexhaustion != newexhaustion) {
                this.actor.update({
                    'data.attributes.newexhaustion': newexhaustion
                });
            }
            this.render();
        });
		
        html.find('.treatwound').click(async event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Treatwounds");
			if(table == undefined){
				ui.notifications.warn("Darksheet | You need to import or create a 'Treatwounds' Table to roll from");
			}
			else{
				const result = await table.roll()
				let content = `
						<h3 style="text-align: center;">${result.results[0].data.text}</h3>
					</div>`;
				let rollWhisper = null;
				let rollBlind = false;
				let rollMode = game.settings.get("core", "rollMode");
				if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
			}
        });

        html.find('.gday').click(async event => {
            event.preventDefault();
            console.log("test");
        });

        html.find('.healwound').click(async event => {
            event.preventDefault();
            let conmod = this.actor.data.data.abilities.con.mod;
            let healtotal = 0;
            let wounds = this.actor.data.data.attributes.wounds.value;
            let maxwounds = 0;
			if(this.actor.data.data.attributes.maxwounds != null){
				maxwounds = this.actor.data.data.attributes.maxwounds.value;
			}
            let i = 0;
            for (i = maxwounds; i > 0; i = i - 1) {
                let roll = new Roll(`1d20`).roll().total;
                let rolltotal = roll + conmod;
                if (rolltotal >= 15) {
                    healtotal++;
                }
            }
            let newwound = this.actor.data.data.attributes.maxwounds.value - healtotal;
            this.actor.update({
                'data.attributes.maxwounds.value': newwound
            });
            if (wounds >= newwound) {
                this.actor.update({
                    'data.attributes.wounds.value': newwound
                });
            }
            this.render();

            let rollWhisper = null;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
            if (rollMode === "blindroll") rollBlind = true;
            ChatMessage.create({
                user: game.user._id,
                content: `<div class="messagecards">
				<b style=" color: #315000; margin-left: 17%;">Wound Heal (Long Rest) DC 15:</b> <br><i>
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
        html.find('.criticalS').click(async event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Critical Success Boons");
            let rollMode = game.settings.get("core", "rollMode");
            let isWhisper = false;
            if (["gmroll", "blindroll"].includes(rollMode)) {
                isWhisper = ChatMessage.getWhisperRecipients("GM")
            }
			if(table == undefined){
				ui.notifications.warn("Darksheet | You need to import or create a 'Critical Success Boons' Table to roll from");
			}
			else{
				const result = await table.roll();
				let content = `
					<div class="dnd5e chat-ca rd item-card" data-acor-id="${this.actor._id}">
						<h3 style="text-shadow: 0 0 1px; text-align: center;">${result.results[0].data.text}</h3>
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
			}
        });
        html.find('.criticalF').click(async event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Critical Failure Consequences");
            if(table == undefined){
				ui.notifications.warn("Darksheet | You need to import or create a 'Critical Failure Consequences' Table to roll from");
			}
			else{
				const result = await table.roll();
				let content = `
					<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<h3 style="text-shadow: 0 0 1px; text-align: center;">${result.results[0].data.text}</h3>
					</div>`;
				let rollWhisper = null;
				let rollBlind = false;
				let rollMode = game.settings.get("core", "rollMode");
				if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
			}
        });
        html.find('.successatcost').click(async event => {
            event.preventDefault();
            let table = game.tables.entities.find(t => t.data.name === "Success at a Cost - Offerings");
			if(table == undefined){
				ui.notifications.warn("Darksheet | You need to import or create a 'Success at a Cost - Offerings' Table to roll from");
			}
			else{
				const result = table.roll()
				let content = `
					<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
						<h3 style="text-shadow: 0 0 0px; text-align: center;">${result.results[0].data.text}</h3>
					</div>`;
				let rollWhisper = null;
				let rollBlind = false;
				let rollMode = game.settings.get("core", "rollMode");
				if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
			}
        });

        html.find('.hitdiceroll').click(async event => {
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
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
		html.find('.handy-ac').click(async event => {
            event.preventDefault();
            let ac = this.actor.data.data.attributes.ac.value;
            let roll1 = new Roll(`d20`).roll().total;
            let roll2 = new Roll(`d20`).roll().total;
            let rollResult = new Roll(`${roll1}`).roll().total + ac;
            let rollResult2 = new Roll(`${roll2}`).roll().total + ac;
            if (game.settings.get('darksheet', 'smalldefense')) {
                rollResult -= 10;
                rollResult2 -= 10;
            }
            let wounds = this.actor.data.data.attributes.wounds.value;
			let actorID = this.actor.data._id;
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
	<h4 class="woundrollmessage" style="text-align: center;" id="${actorID}-woundroll">You need to <b>roll</br> for ${wounds} wound(s)</h4>
	<h4 class="woundrollmessage" style="text-align: center;">One of your items gains a notch<h4>
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
	<h4 class="woundrollmessage" style="text-align: center;" id="${actorID}-woundroll"> You need to <b>roll</br> for ${wounds} wound(s)</h4>
	<h4 class="woundrollmessage" style="text-align: center;">One of your items gains a notch<h4>
</div>`;
            // Send content to chat
            let rollWhisper = false;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
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
		/*LOOK FOR SPELLATTACK*/
		html.find('.spell-dc').click(async event => {
            event.preventDefault();
            let ac = this.actor.data.data.attributes.spelldc;
            let roll1 = new Roll(`d20`).roll().total;
            let roll2 = new Roll(`d20`).roll().total;
            let rollResult = new Roll(`${roll1}+${ac}`).roll().total;
            let rollResult2 = new Roll(`${roll2}+${ac}`).roll().total;
			let actorID = this.actor.data._id;
            let content = `
<div class="dnd5e chat-card item-card" data-acor-id="${this.actor._id}">
    <header class="card-header flexrow">
        <img src="${this.actor.data.token.img}" title="" width="36" height="36" style="border: none;" />        <div class="dice-roll red-dual">
            <h3>Saving Attack</h3>
            <div class="dice-result">
                <div class="dice-formula dice-tooltip" style="display: none;">1d20 + ${ac}</div>
                <div class="dice-row">
                    <div class="dice-row">
                        <div class="tooltip dual-left">
                            <div class="dice-tooltip" style="display: none;">                                <div class="dice">
                                    <p class="part-formula">
                                        1d20 + ${ac}
                                        
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

            // Send content to chat
            let rollWhisper = false;
            let rollBlind = false;
            let rollMode = game.settings.get("core", "rollMode");
            if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
            if (rollMode === "blindroll") rollBlind = false;
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
        });
        /*END LOOK FOR SPELLATTACK END*/
    }
}
class Darkscreen {
    static addChatControl() {
        const chatControlLeft = document.getElementsByClassName("chat-control-icon")[0];
        let tableNode = document.getElementById("DarkScreen-button");

        if (chatControlLeft && !tableNode) {
            const chatControlLeftNode = chatControlLeft.firstElementChild;
            const number = 4;
            tableNode = document.createElement("label");
            tableNode.innerHTML = `<i id="DarkScreen-button" class="fas fa-book-dead DarkScreen-button" style="text-shadow: 0 0 1px black;"></i>`;
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
        templateData.darkscreenval = game.settings.get('darksheet', 'darkscreenval').split(",");
        templateData.darkscreennames = game.settings.get('darksheet', 'darkscreennames').split(",");
        for (let i = 0; i < templateData.darkscreenval.length; i++) {
            templateData[templateData.darkscreennames[i]] = templateData.darkscreenval[i];
        }
        //LOAD QUESTTABLE
		
        const templatePath = "modules/darksheet/templates/darkscreen.html";
        DSC.renderMenu(templatePath, templateData);

    }
    static renderMenu(path, data) {
        const dialogOptions = {
            width: 1134,
            top: event.clientY - 80,
            left: window.innerWidth - 510,
            classes: ['DSC-window resizable']
        };
		dialogOptions.resizable = true;
        renderTemplate(path, data).then(dlg => {
            new Dialog({
                title: game.i18n.localize('Darker Dungeons - Gamemaster Screen [WOP version 0.2]'),
                content: dlg,
                buttons: {}
            }, dialogOptions).render(true);
        });
    }
}
Hooks.on('canvasReady', function() {
    if (game.user.isGM) {
        Darkscreen.addChatControl();
        console.log("Darkscreen GM True");
    }
    /*if (game.settings.get('darksheet', 'hideSRDCOMP')) {
        game.packs.delete("dnd5e.items");
        //		game.packs.delete("dnd5e.classes");
        game.packs.delete("dnd5e.tradegoods");
        game.packs.delete("dnd5e.heroes");
        console.log("Darksheet || Packs deleted");
    }*/
});
Hooks.on('createOwnedItem', (sheet, html, item) => {
	console.log("test");
	html.data.armor = "";
	console.log("test");
});

/*Hooks.on('renderItemSheet5e', (sheet, html, item) => {
	console.log("test");
	let slots = item.item.flags.darksheet.item.slots;
	let id = item.entity._id;
	document.getElementsByClassName('item-properties')[0].innerHTML = '';
	document.getElementsByClassName('item-properties')[0].innerHTML += '<div class="form-group"><label>Quantity</label><input type="text" name="data.quantity" value="'+item.data.quantity+'" data-dtype="Number"/></div>';
	document.getElementsByClassName('item-properties')[0].innerHTML += '<div class="form-group"><label>Weight</label><input type="text" name="data.weight" value="'+item.data.weight+'" placeholder="0" data-dtype="Number"/></div>';
	document.getElementsByClassName('item-properties')[0].innerHTML += '<div class="form-group"><label>Slots</label><input id="slots" type="text" name="flags.darksheet.item.slots" placeholder="0" value="'+slots+'" data-dType="Number"></div>';
    document.getElementsByClassName('item-properties')[0].innerHTML += '<div class="form-group"> <label>Price</label> <input type="text" name="data.price" value="'+item.data.price+'" data-dtype="Number"/></div>';
	
	let tabs = html.find(`form nav.sheet-navigation.tabs`);
    if(tabs.find('a[data-tab=darkitem]').length > 0) {
        return; // already initialized, duplication bug!
    }

    tabs.append($(
        '<a class="item" data-tab="darkitem">DD</a>'
    ));

    $(html.find(`.sheet-body`)).append($(
        '<div class="tab darkitem-content" data-group="primary" data-tab="DD"></div>'
    ));
	
});*/

Hooks.on('closeDialog', function() {
    event.preventDefault();
});
Hooks.on(`ready`, () => {
		Hooks.on('renderDarkSheet', (sheet, html) => {
			//CALL UPDATE TITLE
			DarkSheet.titleupdate();
			
			//RENDER WOUNDS ON DARKSHEET
			let maxwounds = 0;
			if(sheet.actor.data.data.attributes.maxwounds != null){
				maxwounds = sheet.actor.data.data.attributes.maxwounds.value;
			}
			if(sheet.actor.data.data.attributes.inventoryslots == null){
				sheet.actor.update({
						'data.attributes.inventoryslots': "18",
				});
			}
			let woundcount = 0;
			let woundstreated = 0;
			let actorID = sheet.actor.data._id;
			for(let i = 1; i <= 20; i++){
					if(document.getElementById(actorID+"-wounddes"+[i]).value != "")
					{
						document.getElementById(actorID+"-woundtr"+[i]).style = ""
						woundcount ++;
					if(document.getElementById(actorID+"-woundcheck"+[i]).checked){
						woundstreated ++;
					}
					}
			}
			for(let i = 1; i <= 20; i++){
				if(document.getElementById(actorID+"-wounddes"+[i]).value == "" && maxwounds > woundcount)
				{
					document.getElementById(actorID+"-woundtr"+[i]).style = ""
					woundcount ++;
					if(document.getElementById(actorID+"-woundcheck"+[i]).checked){
						woundstreated ++;
					}
				}
			}
			if(sheet.actor.data.data.attributes.maxwounds == undefined || sheet.actor.data.data.attributes.wounds == undefined ||sheet.actor.data.data.attributes.maxwounds.value == undefined){
				sheet.actor.update({
					'data.attributes.wounds.value': "0",
					'data.attributes.maxwounds.value': "0",
				});
			}
			else if(sheet.actor.data.data.attributes.wounds.value != woundstreated){
			sheet.actor.update({
				'data.attributes.wounds.value': woundstreated
			});
			}
			//Intelligent Initiative
			if(game.settings.get('darksheet', 'intmod')){
				sheet.actor.data.data.attributes.init.mod = sheet.actor.data.data.abilities.int.mod;
				sheet.actor.data.data.attributes.init.total = parseInt(sheet.actor.data.data.abilities.int.mod + sheet.actor.data.data.attributes.init.bonus + sheet.actor.data.data.attributes.init.prof);
				document.getElementById('initiativevalue').innerHTML = "+"+sheet.actor.data.data.attributes.init.total;
			}
		});

		if(game.modules.get('betterrolls5e')?.active === true){
			BetterRolls.hooks.addActorSheet("DarkSheet");
			BetterRolls.hooks.addItemSheet("DarkItemSheet5e");
			console.log("Darksheet | BetterRolls detected and enabled");
		}
		if(game.modules.get('magicitems')?.active === true){
		//console.log("Darksheet | Magicitems detected and enabled");
		}
		
		if(game.modules.get('SilverStandard')?.active === true){
			Hooks.on('renderDarkSheet', (sheet, html) => {
			  html.find('.denomination.ep').remove();
			  html.find('[name="data.currency.ep"]').remove();
			});
		console.log("Darksheet | SilverStandard detected and enabled");
		}
		
		if(game.modules.get('betternpcsheet5e')?.active === true){
			Hooks.on('renderBetterNPCActor5eSheet', (sheet, html) => {
			let actor = sheet.object;
			let DAC = 0;
			var profmod = actor.data.data.attributes.prof;
			var dexmod = actor.data.data.abilities.dex.mod;
			var strmod = actor.data.data.abilities.str.mod;
			let inventory = actor.data.items;
			let itemid;
			var i;
			let mod;
			
			for(i = 0; i < actor.data.items.length; i++){
			   itemid = actor.data.items[i]._id;
			   if(actor.data.items[i].type === "weapon"){
				  mod = actor.data.items[i].data.ability;
				  if(mod === "str"){
					  DAC = strmod + profmod;
				  }
				  else if(mod === "dex"){
					  DAC = dexmod + profmod;
				  }
			    if(game.settings.get('darksheet', 'nonpcattack') && actor.data.items[i].data.actionType === "mwak" || game.settings.get('darksheet', 'nonpcattack') && actor.data.items[i].data.actionType === "rwak" ){
                    if(actor.data.items[i].data.save.ability === ""){
					actor.updateEmbeddedEntity('Item', {
                        _id: itemid,
                        "data.actionType": "util"
                    });
					}
					else{
					actor.updateEmbeddedEntity('Item', {
                        _id: itemid,
                        "data.actionType": "save"
                    });
					}
					console.log("Darksheet | Attack " + actor.data.items[i].name +" from " + actor.data.name +" is now Util")
				}
			   }
			}
			if(game.settings.get('darksheet', 'smalldefense')){
					  DAC +=12;
				  }
				  else{
					  DAC +=22;
			}
			html.find('[class="tab active"]').before(`<label style="margin-left: 2.5px;font-weight: bold;">Attack DC: ${DAC}</label>`);
			});
		console.log("Darksheet | BetterNPCActor5eSheet detected and enabled.");
		}
		
});

Hooks.on('createChatMessage', async (msg) => { //GM PUSHES SETTING
	if(!game.user.isGM) return;
	let HadTurn = [];
	HadTurn = game.settings.get('darksheet','ActiveInitiativeHadTurn').split(",");
	console.log("Chat Message Detected");
	let message = msg.data.content;
	let closestActorID = msg.data.flavor;
	if(message.includes("gave his turn to")){
		if(!HadTurn.includes(closestActorID)) HadTurn.push(closestActorID);
		game.settings.set('darksheet','ActiveInitiativeHadTurn', HadTurn.toString());
		game.combat.setInitiative(closestActorID, game.combat.combatants.get(closestActorID).data.initiative+1);
		game.combat.setInitiative(closestActorID, game.combat.combatants.get(closestActorID).data.initiative-1);
		msg.delete();
	}
});

Hooks.on("renderCombatTracker", async function(_combatTracker, html) {

	if(!game.settings.get('darksheet','activeInitiative')) return;
	if(game.combat == undefined) return;
	//ui.notifications.notify("Rendering Combat");
	let HadTurn = [];
	if(game.settings.get('darksheet','ActiveInitiativeHadTurn') != "")
	HadTurn = game.settings.get('darksheet','ActiveInitiativeHadTurn').split(",");
	let HasToHaveTurn = [];
	
	let toAppend = '<div id="TurnOfTurnDebug"> Turn: '+game.settings.get('darksheet','ActiveInitiativeHadTurn').split(",").length+'/'+game.combat.combatants.size+'</div>';
	if(document.getElementById("TurnOfTurnDebug") == undefined)//DISPLAY REMAINING ACTORS
	$("#combat-round").append(toAppend);
	
	for(let i = 0; i < document.getElementsByClassName("token-initiative").length; i++){
		let closestActor = document.getElementsByClassName("token-initiative")[i].closest(".actor");
		let closestActorTID = game.combat.combatants.get(closestActor.getAttribute("data-combatant-id")).id;
		let compareIdTo;

		if(closestActorTID == game.combat.current.combatantId){
			//document.getElementsByClassName("token-initiative")[i].innerHTML = '';
			continue;
		}
		
		if(HadTurn.includes(closestActorTID)) {
			document.getElementsByClassName("token-initiative")[i].innerHTML = 'DONE';
			document.getElementsByClassName("token-initiative")[i].parentElement.children[0].style.setProperty("filter", "grayscale(100%)");//CHANGE COLOR OF TOKEN ONLY
			if(game.user.isGM)
			document.getElementsByClassName("token-initiative")[i].innerHTML = '<button class="AIButton AiButtonGM" id="GiveTurn">DONE</button>';
			continue;
		}
	
		if(!game.user.isGM && game.combat.combatants.get(game.combat.current.combatantId).actor != game.user.character)
		{
		continue;
		}
		document.getElementsByClassName("token-initiative")[i].innerHTML = '<button class="AIButton" id="GiveTurn">Turn</button>';


	}
	/* //DEBUG TOKEN ID
	for(let i = 0; i < document.getElementsByClassName("token-name").length; i++){
		document.getElementsByClassName("token-name")[i].children[0].textContent += " (" + document.getElementsByClassName("token-name")[i].parentElement.dataset.combatantId + ")";
	}*/
	
	if(game.settings.get('darksheet', 'activeInitiativeDisplayTurns')){
		if(game.combat.combatants.get(HadTurn[0]) != undefined ){
			$("#combat-round").append('<div style="line-break: anywhere;max-height: 97px;overflow: auto;"id="HadTurnDebug">');
			for(let h = 0; h < HadTurn.length; h ++){
				$("#HadTurnDebug").append('<div style="line-break: anywhere;"id="HadTurnDebug">'+game.combat.combatants.get(HadTurn[h]).name+'</div>');
				
			}
		}                 
	}

	function getPosition(elementToFind, arrayElements) {
		var i;
		for (i = 0; i < arrayElements.size; i += 1) {
			if (game.combat.combatants.document.turns[i] === elementToFind) {
				return i;
			}
		}
		return null; //not found
	}
		
	html.find('.AIButton').click(async event => {
			event.preventDefault();
			//ui.notifications.notify("Clicked Turn for " + game.combat.combatants.get(event.target.closest(".actor").getAttribute("data-combatant-id")).actor.name);
			let closestActorID =  game.combat.combatants.get(event.target.closest(".actor").getAttribute("data-combatant-id")).id;
			if(!HadTurn.includes(closestActorID))HadTurn.push(closestActorID);
			if(game.user.isGM)
			game.settings.set('darksheet','ActiveInitiativeHadTurn', HadTurn.toString());
		
			//console.log(HadTurn);
			
			let Test = getPosition(game.combat.combatants.get(closestActorID), game.combat.combatants);
			if(game.combat.current.turn < Test){
				for(let n = game.combat.current.turn; n < Test ; n ++){
					await game.combat.nextTurn();
				}
			}
			else if(game.combat.current.turn > Test){
				for(let n = game.combat.current.turn; n > Test ; n --){
					await game.combat.previousTurn();
				}
			}
			
			if(!game.user.isGM){//NON GM'S PUSH A MESSAGE
                ChatMessage.create({
                user: game.user._id,
                content: game.user.name + " gave his turn to " + game.combat.combatants.get(event.target.closest(".actor").getAttribute("data-combatant-id")).name,
				flavor: closestActorID,
				blind: true,
                })
			}
	});
		
	if(game.user.isGM){//REMOVING SOME CONTROLS FROM THE COMBATTRACKER
		if(document.getElementsByClassName("combat-control")[4].text == ""){
			if(HadTurn.length >= game.combat.combatants.size)
			$( ".combat" ).append( '<a class="combat-control directory-footer flexrow" title="Next Round" data-control="nextRound" style="flex: 0.1;width: 100%;background: #0043ff4a;text-align: center;font-size: 20px;align-content: space-around;"><i class="fas fa-step-forward"></i></a>' );
			if(document.getElementsByClassName("combat-control")[5].title == "Previous Turn")
				document.getElementsByClassName("combat-control")[5].remove()
			if(document.getElementsByClassName("combat-control")[6].title == "Next Turn");
				document.getElementsByClassName("combat-control")[6].remove()
		}
	}
	else{
		if(document.getElementById("combat-controls") != undefined)
		document.getElementById("combat-controls").remove()
	}
	if(!game.user.isGM)	return;
	//NEW ROUND?
	if(game.combat.current.round != game.combat.previous.round){
		let LastTurnID = game.settings.get('darksheet','ActiveInitiativeHadTurn').split(",")[game.settings.get('darksheet','ActiveInitiativeHadTurn').split(",").length-1];
		if(game.settings.get('darksheet','ActiveInitiativeHadTurn') == "") return;
		game.settings.set('darksheet','ActiveInitiativeHadTurn', "");
		if(game.combat.current.combatantId == LastTurnID){
			await game.combat.nextTurn();
			await  game.combat.previousTurn();
		}
		while(game.combat.current.combatantId != LastTurnID){//RESET TURN 
			await game.combat.nextTurn();
		}
	}
		
});
