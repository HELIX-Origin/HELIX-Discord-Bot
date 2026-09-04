# Skill: RPG Maker MZ/MV Plugin Development

## Overview
Guidelines, header specifications, and JavaScript hook patterns for developing plugins in RPG Maker MZ and RPG Maker MV.

## Plugin Header Standard (MZ Format)
Every plugin must begin with a structured comment block so the RPG Maker editor can parse parameters and commands:

```javascript
/*:
 * @target MZ
 * @plugindesc v1.0.0 HELIX Custom Mechanics Plugin
 * @author HELIX CLI
 * @url https://helix-cli.dev
 * 
 * @help Helix_CustomMechanics.js
 * 
 * This plugin provides custom gameplay hooks.
 * 
 * @param BonusExperienceRate
 * @text Bonus EXP Multiplier
 * @desc Multiplier applied to gained EXP.
 * @type number
 * @decimals 2
 * @default 1.50
 * 
 * @command GrantBonusItem
 * @text Grant Bonus Item
 * @desc Grants a specified item directly to the party inventory.
 * 
 * @arg itemId
 * @text Item ID
 * @type item
 * @default 1
 */

(() => {
    'use strict';
    const pluginName = 'Helix_CustomMechanics';
    const parameters = PluginManager.parameters(pluginName);
    const expRate = Number(parameters['BonusExperienceRate'] || 1.0);

    PluginManager.registerCommand(pluginName, 'GrantBonusItem', args => {
        const itemId = Number(args.itemId);
        $gameParty.gainItem($dataItems[itemId], 1);
    });

    // Hook game actor EXP gain
    const _Game_Actor_changeExp = Game_Actor.prototype.changeExp;
    Game_Actor.prototype.changeExp = function(exp, show) {
        _Game_Actor_changeExp.call(this, Math.round(exp * expRate), show);
    };
})();
```

## Best Practices
- **Never mutate native prototypes destructively**: Always alias original engine methods (`const _alias = Class.prototype.method;`).
- **Strict Scope**: Wrap plugin implementations in IIFEs (`(() => { ... })();`) with `'use strict';`.
- **Parameter Validation**: Validate and cast parameter strings to numbers or booleans explicitly.
