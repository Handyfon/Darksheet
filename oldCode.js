html.find('.removewoundbutton').click(async event => {
    //update the actor
    let newwound = parseFloat(this.actor.system.attributes.maxwounds.value) - 1;
    let newtext = "";
    let button = event.currentTarget.id;
    let target = 'system.attributes.darksheet-wounds.'+ button;
    let newcheck = false;
    switch(button){
        case "wound1": this.actor.update({'system.attributes.darksheet-wounds.wound1': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound1treated.value': newcheck,}); break;
        case "wound2": this.actor.update({'system.attributes.darksheet-wounds.wound2': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound2treated.value': newcheck,}); break;
        case "wound3": this.actor.update({'system.attributes.darksheet-wounds.wound3': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound3treated.value': newcheck,}); break;
        case "wound4": this.actor.update({'system.attributes.darksheet-wounds.wound4': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound4treated.value': newcheck,}); break;
        case "wound5": this.actor.update({'system.attributes.darksheet-wounds.wound5': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound5treated.value': newcheck,}); break;
        case "wound6": this.actor.update({'system.attributes.darksheet-wounds.wound6': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound61treated.value': newcheck,}); break;
        case "wound7": this.actor.update({'system.attributes.darksheet-wounds.wound7': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound7treated.value': newcheck,}); break;
        case "wound8": this.actor.update({'system.attributes.darksheet-wounds.wound8': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound8treated.value': newcheck,}); break;
        case "wound9": this.actor.update({'system.attributes.darksheet-wounds.wound9': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound9treated.value': newcheck,}); break;
        case "wound10": this.actor.update({'system.attributes.darksheet-wounds.wound10': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound10treated.value': newcheck,}); break;
        case "wound11": this.actor.update({'system.attributes.darksheet-wounds.wound11': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound11treated.value': newcheck,}); break;
        case "wound12": this.actor.update({'system.attributes.darksheet-wounds.wound12': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound12treated.value': newcheck,}); break;
        case "wound13": this.actor.update({'system.attributes.darksheet-wounds.wound13': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound13treated.value': newcheck,}); break;
        case "wound14": this.actor.update({'system.attributes.darksheet-wounds.wound14': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound14treated.value': newcheck,}); break;
        case "wound15": this.actor.update({'system.attributes.darksheet-wounds.wound15': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound15treated.value': newcheck,}); break;
        case "wound16": this.actor.update({'system.attributes.darksheet-wounds.wound16': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound16treated.value': newcheck,}); break;
        case "wound17": this.actor.update({'system.attributes.darksheet-wounds.wound17': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound17treated.value': newcheck,}); break;
        case "wound18": this.actor.update({'system.attributes.darksheet-wounds.wound18': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound18treated.value': newcheck,}); break;
        case "wound19": this.actor.update({'system.attributes.darksheet-wounds.wound19': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound19treated.value': newcheck,}); break;
        case "wound20": this.actor.update({'system.attributes.darksheet-wounds.wound20': newtext,'system.attributes.maxwounds.value': newwound,'system.attributes.darksheet-wounds.wound20treated.value': newcheck,}); break;
    }
 })
 html.find('.addwoundbutton').click(async event => {
    event.preventDefault();
    if (this.actor.system.attributes.maxwounds.value >= 20) {
        ui.notifications.warn("Darksheet | You can not have more than 20 wounds.");

    } else {
        let newwound = parseFloat(this.actor.system.attributes.maxwounds.value) + 1;
        this.actor.update({
            'system.attributes.maxwounds.value': newwound
        });
    }
});
html.find('.woundroll').click(async event => {
    event.preventDefault();
    let table = game.tables.find(t => t.data.name === "Reopening Wounds");
    let wounds = this.actor.system.attributes.wounds.value;
    if (wounds == 0) {
        ui.notifications.warn("You don't have any closed wounds that could reopen.");
        return;
    }
    let i = 0;
    let subtractVal = 0;
    let woundstreated
    let newcheck = false;
    for (let i = 1; i <= 20; i++) {
        if (document.getElementById(this.actor.id + "-woundcheck" + [i]).checked) {
            //let result = table.roll()
            let roll = await new Roll(`1d20`).roll().total;
            let Woundname = "";
            if (document.getElementById(this.actor.id + "-wounddes" + [i]).value != "") {
                Woundname = document.getElementById(this.actor.id + "-wounddes" + [i]).value;
            }
            let epicfail = `
            <div class="dnd5e chat-card item-card" data-acor-id="${this.actor.id}">
                <header class="card-header flexrow">
                    <img src="${this.actor.prototypeToken.texture.src}" title="" width="36" height="36" style="border: none;"/>
                    <h3>Woundroll#${i} : ${Woundname}</h3>
                </header>
                </br>
                <b><i style="color: #ff0000">The wound reopens +1 Exhaustion and you lose a hit die
            </div>`;
            let fail = `
            <div class="dnd5e chat-card item-card" data-acor-id="${this.actor.id}">
                <header class="card-header flexrow">
                    <img src="${this.actor.prototypeToken.texture.src}" title="" width="36" height="36" style="border: none;"/>
                    <h3>Woundroll#${i} : ${Woundname}</h3>
                </header>
                </br>
                <i style="color: #ff0000">The wound reopens + 1 Exhaustion
            </div>`;
            let success = `
            <div class="dnd5e chat-card item-card" data-acor-id="${this.actor.id}">
                <header class="card-header flexrow">
                    <img src="${this.actor.prototypeToken.texture.src}" title="" width="36" height="36" style="border: none;"/>
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
                    user: game.user.id,
                    content: epicfail,
                    speaker: {
                        actor: this.actor.id,
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
                switch (i) {
                    case 1:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound1treated.value': newcheck,
                        });
                        break;
                    case 2:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound2treated.value': newcheck,
                        });
                        break;
                    case 3:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound3treated.value': newcheck,
                        });
                        break;
                    case 4:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound4treated.value': newcheck,
                        });
                        break;
                    case 5:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound5treated.value': newcheck,
                        });
                        break;
                    case 6:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound61treated.value': newcheck,
                        });
                        break;
                    case 7:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound7treated.value': newcheck,
                        });
                        break;
                    case 8:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound8treated.value': newcheck,
                        });
                        break;
                    case 9:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound9treated.value': newcheck,
                        });
                        break;
                    case 10:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound10treated.value': newcheck,
                        });
                        break;
                    case 11:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound11treated.value': newcheck,
                        });
                        break;
                    case 12:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound12treated.value': newcheck,
                        });
                        break;
                    case 13:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound13treated.value': newcheck,
                        });
                        break;
                    case 14:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound14treated.value': newcheck,
                        });
                        break;
                    case 15:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound15treated.value': newcheck,
                        });
                        break;
                    case 16:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound16treated.value': newcheck,
                        });
                        break;
                    case 17:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound17treated.value': newcheck,
                        });
                        break;
                    case 18:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound18treated.value': newcheck,
                        });
                        break;
                    case 19:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound19treated.value': newcheck,
                        });
                        break;
                    case 20:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound20treated.value': newcheck,
                        });
                        break;

                }
            } else if (roll <= 8) {
                ChatMessage.create({
                    user: game.user.id,
                    content: fail,
                    speaker: {
                        actor: this.actor.id,
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
                switch (i) {
                    case 1:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound1treated.value': newcheck,
                        });
                        break;
                    case 2:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound2treated.value': newcheck,
                        });
                        break;
                    case 3:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound3treated.value': newcheck,
                        });
                        break;
                    case 4:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound4treated.value': newcheck,
                        });
                        break;
                    case 5:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound5treated.value': newcheck,
                        });
                        break;
                    case 6:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound61treated.value': newcheck,
                        });
                        break;
                    case 7:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound7treated.value': newcheck,
                        });
                        break;
                    case 8:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound8treated.value': newcheck,
                        });
                        break;
                    case 9:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound9treated.value': newcheck,
                        });
                        break;
                    case 10:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound10treated.value': newcheck,
                        });
                        break;
                    case 11:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound11treated.value': newcheck,
                        });
                        break;
                    case 12:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound12treated.value': newcheck,
                        });
                        break;
                    case 13:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound13treated.value': newcheck,
                        });
                        break;
                    case 14:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound14treated.value': newcheck,
                        });
                        break;
                    case 15:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound15treated.value': newcheck,
                        });
                        break;
                    case 16:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound16treated.value': newcheck,
                        });
                        break;
                    case 17:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound17treated.value': newcheck,
                        });
                        break;
                    case 18:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound18treated.value': newcheck,
                        });
                        break;
                    case 19:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound19treated.value': newcheck,
                        });
                        break;
                    case 20:
                        this.actor.update({
                            'system.attributes.darksheet-wounds.wound20treated.value': newcheck,
                        });
                        break;
                }
            } else {
                ChatMessage.create({
                    user: game.user.id,
                    content: success,
                    speaker: {
                        actor: this.actor.id,
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
    let temp = this.actor.system.attributes.temp;
    let food = this.actor.system.attributes.saturation.value;
    let water = this.actor.system.attributes.thirst.value;
    let fatigue = this.actor.system.attributes.fatigue.value;
    let manualexhaustion = this.actor.system.attributes.exhaustion.value;
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
    this.actor.system.attributes.newexhaustion = newexhaustion;
    console.log("(DarkSheet): New Exhaustion: " + this.actor.system.attributes.newexhaustion);
    if (this.actor.system.attributes.newexhaustion != newexhaustion) {
        this.actor.update({
            'system.attributes.newexhaustion': newexhaustion
        });
    }
    this.render();
});

html.find('.treatwound').click(async event => {
    event.preventDefault();
    let table = game.tables.find(t => t.data.name === "Treatwounds");
    if (table == undefined) {
        ui.notifications.warn("Darksheet | You need to import or create a 'Treatwounds' Table to roll from");
    } else {
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
            user: game.user.id,
            content: content,
            speaker: {
                actor: this.actor.id,
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
html.find('.healwound').click(async event => {
    event.preventDefault();
    let conmod = this.actor.system.abilities.con.mod;
    let healtotal = 0;
    let wounds = this.actor.system.attributes.wounds.value;
    let maxwounds = 0;
    if (this.actor.system.attributes.maxwounds != null) {
        maxwounds = this.actor.system.attributes.maxwounds.value;
    }
    let i = 0;
    for (i = maxwounds; i > 0; i = i - 1) {
        let roll = await new Roll(`1d20`).roll().total;
        let rolltotal = roll + conmod;
        if (rolltotal >= 15) {
            healtotal++;
        }
    }
    let newwound = this.actor.system.attributes.maxwounds.value - healtotal;
    this.actor.update({
        'system.attributes.maxwounds.value': newwound
    });
    if (wounds >= newwound) {
        this.actor.update({
            'system.attributes.wounds.value': newwound
        });
    }
    this.render();

    let rollWhisper = null;
    let rollBlind = false;
    let rollMode = game.settings.get("core", "rollMode");
    if (["gmroll", "blindroll"].includes(rollMode)) rollWhisper = ChatMessage.getWhisperRecipients("GM")
    if (rollMode === "blindroll") rollBlind = true;
    ChatMessage.create({
        user: game.user.id,
        content: `<div class="messagecards">
        <b style=" color: #315000; margin-left: 17%;">Wound Heal (Long Rest) DC 15:</b> <br><i>
                <h4 style="text-shadow: 0 0 0px; text-align: center;"> You heal a total of ${healtotal} wounds</h4>
            </div>
        </div>`,
        speaker: {
            actor: this.actor.id,
            token: this.actor.token,
            alias: this.actor.name
        },

        blind: rollBlind,
        sound: CONFIG.sounds.dice
    });
});
function addwound(){
    let actor = game.actors.get(event.currentTarget.closest('.actor').id.replace('actor-',''));
    let maxwounds = parseInt(actor.system.attributes.maxwounds.value);
    maxwounds += 1;
    let woundlisttext;
    let woundlist = sheet.actor.system.attributes.woundlist;
    let actordata = sheet.actor;
    for(let i = 0; i < sheet.actor.system.attributes.maxwounds.value; i++){
        woundlisttext = "wound"+i;//HIER GEHTS WEITER
        woundlisttext = woundlist[woundlisttext];
        if(woundlisttext === ""){
        actordata.system.attributes.woundlist[woundlisttext] = "Put something here";
        }
    }
    let update = actordata.system.attributes.woundlist;
    sheet.actor.update({'system.attributes.woundlist': update});
    actor.update({'system.attributes.maxwounds.value': maxwounds});
    console.log(actor);
    console.log(actor.system.attributes.woundslist);
}
