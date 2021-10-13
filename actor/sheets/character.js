//import ActorSheet5e from "./base.js";
//import Actor5e from "../../../../systems/dnd5e/module/actor/entity.js";
import ActorSheet5eCharacter from "../../../../systems/dnd5e/module/actor/sheets/character.js"

export class ActorSheet5eCharacterDark extends ActorSheet5eCharacter { 
  getData() {
    const sheetData = super.getData();
    // Experience Tracking
    sheetData["disableExperience"] = game.settings.get("dnd5e", "disableExperienceTracking");
    sheetData["classLabels"] = this.actor.itemTypes.class.map(c => c.name).join(", ");
	sheetData["slotSetting"] = game.settings.get("darksheet", "slotbasedinventory");

    // Return data for rendering
    return sheetData;
  }
  _prepareItems(data) {

	// Categorize items as inventory, spellbook, features, and classes
    const inventory = {
      weapon: { label: "DND5E.ItemTypeWeaponPl", items: [], dataset: {type: "weapon"} },
      equipment: { label: "DND5E.ItemTypeEquipmentPl", items: [], dataset: {type: "equipment"} },
      consumable: { label: "DND5E.ItemTypeConsumablePl", items: [], dataset: {type: "consumable"} },
      tool: { label: "DND5E.ItemTypeToolPl", items: [], dataset: {type: "tool"} },
      backpack: { label: "DND5E.ItemTypeContainerPl", items: [], dataset: {type: "backpack"} },
      loot: { label: "DND5E.ItemTypeLootPl", items: [], dataset: {type: "loot"} }
    };

    // Partition items by category
    let [items, spells, feats, classes] = data.items.reduce((arr, item) => {

      // Item details
      item.img = item.img || CONST.DEFAULT_TOKEN;
      item.isStack = Number.isNumeric(item.data.quantity) && (item.data.quantity !== 1);
      item.attunement = {
        [CONFIG.DND5E.attunementTypes.REQUIRED]: {
          icon: "fa-sun",
          cls: "not-attuned",
          title: "DND5E.AttunementRequired"
        },
        [CONFIG.DND5E.attunementTypes.ATTUNED]: {
          icon: "fa-sun",
          cls: "attuned",
          title: "DND5E.AttunementAttuned"
        }
      }[item.data.attunement];

      // Item usage
      item.hasUses = item.data.uses && (item.data.uses.max > 0);
      item.isOnCooldown = item.data.recharge && !!item.data.recharge.value && (item.data.recharge.charged === false);
      item.isDepleted = item.isOnCooldown && (item.data.uses.per && (item.data.uses.value > 0));
      item.hasTarget = !!item.data.target && !(["none", ""].includes(item.data.target.type));

      // Item toggle state
      this._prepareItemToggleState(item);

      // Primary Class
      if ( item.type === "class" ) item.isOriginalClass = ( item._id === this.actor.data.data.details.originalClass );

      // Classify items into types
      if ( item.type === "spell" ) arr[1].push(item);
      else if ( item.type === "feat" ) arr[2].push(item);
      else if ( item.type === "class" ) arr[3].push(item);
      else if ( Object.keys(inventory).includes(item.type ) ) arr[0].push(item);
      return arr;
    }, [[], [], [], []]);

	// Apply active item filters
    items = this._filterItems(items, this._filters.inventory);
    spells = this._filterItems(spells, this._filters.spellbook);
    feats = this._filterItems(feats, this._filters.features);

	// Organize items
    for ( let i of items ) {
      i.data.quantity = i.data.quantity || 0;
      i.data.weight = i.data.weight || 0;
      i.totalWeight = (i.data.quantity * i.data.weight).toNearest(0.1);
      inventory[i.type].items.push(i);
    }
	// Organize Spellbook and count the number of prepared spells (excluding always, at will, etc...)
    const spellbook = this._prepareSpellbook(data, spells);
    const nPrepared = spells.filter(s => {
      return (s.data.level > 0) && (s.data.preparation.mode === "prepared") && s.data.preparation.prepared;
    }).length;

    // Organize Features
    const features = {
      classes: { label: "DND5E.ItemTypeClassPl", items: [], hasActions: false, dataset: {type: "class"}, isClass: true },
      active: { label: "DND5E.FeatureActive", items: [], hasActions: true, dataset: {type: "feat", "activation.type": "action"} },
      passive: { label: "DND5E.FeaturePassive", items: [], hasActions: false, dataset: {type: "feat"} }
    };
    for ( let f of feats ) {
      if ( f.data.activation.type ) features.active.items.push(f);
      else features.passive.items.push(f);
    }
    classes.sort((a, b) => b.data.levels - a.data.levels);
    features.classes.items = classes;
	
    // Calculate Weight
    let totalWeight = 0;
	let pct = 0;
	let enc = 1;
	let maxpct = parseInt(data.data.attributes.inventoryslots) + parseInt(this.actor.data.data.abilities.str.mod);
	if ( game.settings.get("darksheet", "slotbasedinventory") ) {
    for ( let i of items ) {
      i.data.quantity = i.data.quantity || 0;
	  if(i.flags.darksheet===undefined) {i.flags.darksheet={item:{slot:'1'}}}
	  i.flags.darksheet.item.slots = getProperty(i, 'flags.darksheet.item.slots') || 0; 
//	  console.log(i.data.slots);
      i.totalWeight = Math.round(i.data.quantity * i.flags.darksheet.item.slots *10)/10;
      //inventory[i.type].items.push(i);
      totalWeight += i.totalWeight;
    }
	    data.data.attributes.inventorys = computeEncumbrance(this.actor.data);
	    data.data.attributes.inventorys.max = maxpct;
	    data.data.attributes.inventorys.percent = totalWeight / maxpct *100;

	}
	else{
		for ( let i of items ) { 
		  i.data.quantity = i.data.quantity || 0;
		  i.data.weight = i.data.weight || 0;
		  i.totalWeight = Math.round(i.data.quantity * i.data.weight * 10) / 10;
		  //inventory[i.type].items.push(i);
		  totalWeight += i.totalWeight;
		}
		data.data.attributes.encumbs = computeEncumbrance(this.actor.data);
	}
	
    // Assign and return
    data.inventory = Object.values(inventory);
    data.spellbook = spellbook;
    data.preparedSpells = nPrepared;
    data.features = Object.values(features);
  }
}
function computeEncumbrance(actorData) {

    // Get the total weight from items
    const physicalItems = ["weapon", "equipment", "consumable", "tool", "backpack", "loot"];
    let weight = actorData.items.reduce((weight, i) => {
      if ( !physicalItems.includes(i.type) ) return weight;
      const q = i.data.data.quantity || 0;
      let w = 0;
	  if(game.settings.get("darksheet", "slotbasedinventory") && i.data.flags.darksheet != null)
		w = i.data.flags.darksheet.item.slots || 0;
	  else
		w = i.data.data.weight || 0;
	
      return weight + (q * w);
    }, 0);

    // [Optional] add Currency Weight (for non-transformed actors)
    if ( game.settings.get("dnd5e", "currencyWeight") && actorData.data.currency ) {
      const currency = actorData.data.currency;
      let numCoins = Object.values(currency).reduce((val, denom) => val += Math.max(denom, 0), 0);

      let currencyPerWeight = game.settings.get("dnd5e", "metricWeightUnits")
        ? CONFIG.DND5E.encumbrance.currencyPerWeight.metric
        : CONFIG.DND5E.encumbrance.currencyPerWeight.imperial;

	  if(game.settings.get("darksheet", "slotbasedinventory")){
		numCoins = numCoins - 100;
		currencyPerWeight = 100;
		if(numCoins <= 0) 
			numCoins = 0;
		
	  }
      weight += numCoins / currencyPerWeight;
    }

    // Determine the encumbrance size class
    let mod = {
      tiny: 0.5,
      sm: 1,
      med: 1,
      lg: 2,
      huge: 4,
      grg: 8
    }[actorData.data.traits.size] || 1;
    if ( actorData.document.getFlag("dnd5e", "powerfulBuild") ) mod = Math.min(mod * 2, 8);

    // Compute Encumbrance percentage
    weight = weight.toNearest(0.1);

    const strengthMultiplier = game.settings.get("dnd5e", "metricWeightUnits")
      ? CONFIG.DND5E.encumbrance.strMultiplier.metric
      : CONFIG.DND5E.encumbrance.strMultiplier.imperial;

    const max = (actorData.data.abilities.str.value * strengthMultiplier * mod).toNearest(0.1);
    const pct = Math.clamped((weight * 100) / max, 0, 100);
    return { value: weight.toNearest(0.1), max, pct, encumbered: pct > (200/3) };
  }