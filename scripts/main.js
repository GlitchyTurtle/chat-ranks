import { world, Player } from "mojang-minecraft";
import { ActionFormData, ModalFormData } from "mojang-minecraft-ui"

const World = world;

function getScore(objective, player, { minimum, maximum } = {}) {
    try {
        const data = player.runCommand(`scoreboard players test "${player.nameTag}" ${objective} ${minimum ? minimum : "*"} ${maximum ? maximum : "*"}`);
        return parseInt(data.statusMessage.match(/-?\d+/));
    } catch (error) {
        return;
    }
}

function convert(rank) {
  try {
    rank = rank.replace('Rank:', '');
    rank = rank.replace('[', '');
    rank = rank.replace(']', '');
    const middleText = rank.split('%:')[1].split(':%')[0]
    const score = 3
    rank = rank.replace(middleText, score);
    rank = rank.replace('%:', '');
    rank = rank.replace(':%', '');
    return rank;
  } catch (error) {
    console.log("error")
  }
}

function removeRanks(player) {
  let tags = player.getTags();
  tags.forEach(t => {
    if(t.startsWith("Rank:")) {
      player.removeTag(t);
    }
  });
}

World.events.beforeChat.subscribe(msg => {
  let message = msg.message;
  let player = msg.sender;
  let tags = player.getTags();
  let style = getScore("style", player)
  let realmbot = true;
  let rank;
  
  if (!rank) {
    if (style === 0) {
      rank = '[Member]'
    } else if (style === 1) {
      rank = '§r[Member]'
    } else if (style === 2) {
      rank = '§8§l[§bMember§8§l]§r'
    } else if (style === 3) {
      rank = '§f§l[§7Member§f§l]§r'
    }
  }

  for (const tag of tags) {
    if (style === 0 && tag.startsWith('Rank:')) {
      rank = convert(rank)
    } else if (style === 1 && tag.startsWith('Rank:')) {
      rank = convert(rank)
      rank = rank.replaceAll('--', '§r][§r');
      rank = '§r[§r' + rank + '§r]§r'
    } else if (style === 2 && tag.startsWith('Rank:')) {
      rank = convert(rank)
      rank = rank.replaceAll('--', '§8§l][§r');
      rank = '§8§l[§b' + rank + '§8§l]§r'
    } else if (style === 3 && tag.startsWith('Rank:')) {
      rank = convert(rank)
      rank = rank.replaceAll('--', '§f§l][§r');
      rank = '§f§l[§7' + rank + '§f§l]§r'
    }
  }
  
  if (!msg.cancel) {
    if (realmbot) {
      try {
        player.runCommand(`tellraw RealmBot ${JSON.stringify({rawtext:[{text:'RB_COMMAND' + '{content:\'' + rank + ' ' + player.name + ':§r ' + message + '\'}'}]})}`);
      } catch (error) {
        player.runCommand(`tellraw @a ${JSON.stringify({rawtext:[{text: rank + ' ' + player.name + ':§r ' + message}]}).replace(/\\"/g, '"')}`);
        msg.cancel = true;
      }
    } else {
      player.runCommand(`tellraw @a ${JSON.stringify({rawtext:[{text: rank + ' ' + player.name + ':§r ' + message}]}).replace(/\\"/g, '"')}`);
      msg.cancel = true;
    }
  }
})

World.events.beforeItemUse.subscribe(eventdata => {
  let { item, source } = eventdata;

  if (!(source instanceof Player) || !source.hasTag("ChatStaff")) {
    return;
  }
  
  if (item.id === "minecraft:compass" && item.data === 101) {

    let style = ["No Theme", "Basic Theme", "Dark Theme", "Light Theme"];
    let players = ["Optional"];

    for (let player of World.getPlayers()) {
      players.push(player.name);
    }

    let mainMenu = new ActionFormData();
    mainMenu.title("Chat Ranks Menu:");
    mainMenu.body("Edit ranks here! You can insert scoreboards using %:scoreboardname:%");
    mainMenu.button("Assign Ranks", "textures/items/compass_item");
    mainMenu.button("Global Settings", "textures/items/comparator");

    let assignMenu = new ModalFormData();
    assignMenu.title("Chat Ranks Menu:");
    assignMenu.textField("Type Rank:", "[Member]");
    assignMenu.textField("Choose Player:", "Player Name");
    assignMenu.dropdown("Choose Player (quick select):", players, 0);
    
    let settingMenu = new ModalFormData();
    settingMenu.title("Chat Ranks Menu:");
    settingMenu.dropdown("Theme:", style, 0);

    mainMenu.show(source).then((ActionFormResponse) => {
      const { selection } = ActionFormResponse;
      if (selection === 0) {
        assignMenu.show(source).then((ModalFormResponse) => {
          const { formValues } = ModalFormResponse;
          let [rank, player, playerQuick] = formValues;
          console.warn(`mainMenu : ${playerQuick}`)
          if (rank) {
            if (!playerQuick) {
              removeRanks(source);
              source.runCommand(`tag @a[name=${player}] add "Rank:${rank}"`);
            } else {
              removeRanks(source);
              source.runCommand(`tag @a[name=${players[playerQuick]}] add "Rank:${rank}"`);
            }
          } else {
            source.runCommand(`tellraw @s {"rawtext":[{"text":"§cYou forgot to choose a tag."}]}`);
          }
        })
      } else if (selection === 1) {
        settingMenu.show(source).then((ModalFormResponse) => {
          const { formValues } = ModalFormResponse;
          let [theme] = formValues;
          source.runCommand(`scoreboard players set @s style ${theme}`);
        })
      }
    })
  }
})
