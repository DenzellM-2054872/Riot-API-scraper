import fs from 'fs';

let data_folder = "overview/15.4/OC1"
let data: {[game_type: string]: object[]} = {}
let champs: {[champ: string]: {"games": number, "wins": number, "losses": number}} = {}
let content = fs.readdirSync(data_folder, { withFileTypes: true })

const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

for(let dir of dirs){
    let files = fs.readdirSync(`${data_folder}/${dir}/`, { withFileTypes: true })
    data[dir] = []
    for(let file of files){
        data[dir].push(JSON.parse(fs.readFileSync(`${data_folder}/${dir}/${file.name}`, {encoding: "utf-8"})))
    }
}

for(let mode in data){
    let champs_mode: {[champ: string]: {"games": number, "wins": number, "losses": number}} = {}
    for(let game of data[mode]){
        for(let player of game['info']['participants']){
            if(!champs_mode[player['championName']]) champs_mode[player['championName']] = {"wins": 0, "losses": 0, "games": 0}
            champs_mode[player['championName']].games++
            if(player['win']) champs_mode[player['championName']].wins++
            else champs_mode[player['championName']].losses++
        }
        
    }
    fs.writeFileSync(`${mode}.csv`, `Name, Games, Wins, Losses, WR\n`, {flag: "w+"})
    for(let champ in champs_mode){
        if(!champs[champ]) champs[champ] = {"wins": 0, "losses": 0, "games": 0}
        fs.writeFileSync(`${mode}.csv`,`${champ},${champs_mode[champ].games},${champs_mode[champ].wins},${champs_mode[champ].losses},${Math.round((champs_mode[champ].wins / champs_mode[champ].games) * 10000) / 100}\n`, {flag: "a+"})
            champs[champ].games += champs_mode[champ].games
            champs[champ].losses += champs_mode[champ].losses
            champs[champ].wins += champs_mode[champ].wins

}
}
fs.writeFileSync('total.csv', `Name, Games, Wins, Losses, WR\n`, {flag: "w+"})
for(let champ in champs){
    fs.writeFileSync(`total.csv`,`${champ},${champs[champ].games},${champs[champ].wins},${champs[champ].losses},${Math.round((champs[champ].wins / champs[champ].games) * 10000) / 100}\n`, {flag: "a+"})
}