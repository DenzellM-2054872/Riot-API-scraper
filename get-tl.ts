import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import {sortW} from './sort-clean';
import queues from './queues.json'

export default async function getTL(arg: string, opt: Array<string>){
    const riotToken = fs.readFileSync(opt['token'],'utf8');
    const inst = rateLimit(rateLimit(axios.create(), {maxRPS: 20}), {maxRequests: 100, perMilliseconds:120000});
    inst.defaults.headers.common['X-Riot-Token'] = riotToken;

    let region: string = arg;
    let readDir: string = opt['readDir'];
    let writeDir: string = opt['writeDir'];
    let patch: string = opt['patch'];

    switch (region) {
        case "EUW1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "EUN1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "RU":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "TR1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;
        case "ME1":
            inst.defaults.baseURL = 'https://europe.api.riotgames.com';
            break;

        case "OC1":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "SG2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "TW2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break
        case "VN2":
            inst.defaults.baseURL = 'https://sea.api.riotgames.com';
            break

        case "NA1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "BR1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA1":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break
        case "LA2":
            inst.defaults.baseURL = 'https://americas.api.riotgames.com';
            break

        case "KR":
            inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break
        case "JP1":
            inst.defaults.baseURL = 'https://asia.api.riotgames.com';
            break

        default:
            console.log("region not recognised");
            return;
    }

    if(!fs.existsSync(`${writeDir}/${patch}`)){
        fs.mkdirSync(`${writeDir}/${patch}`)
    }

    if(!fs.existsSync(`${writeDir}/${patch}/${region}`)){
        fs.mkdirSync(`${writeDir}/${patch}/${region}`)
    }

    let ID = opt['id'];
    let content = fs.readdirSync(`${readDir}/${patch}/${region}/`, { withFileTypes: true })
    let files = content.filter(dirent => dirent.isFile());
    const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

    for(let directory of dirs){
        content = fs.readdirSync(`${readDir}/${patch}/${region}/${directory}/`, { withFileTypes: true })
        files = files.concat(content.filter(dirent => dirent.isFile()))
    }

    files.sort();
    for(let i = 0; i < files.length; i++){
        try{
            ID = Number(files[i].name.replace(`overview_${region}_`, "").replace(".json", ""));
            if (fs.existsSync(`${files[i].parentPath.replace('overview', 'timeline')}/${files[i].name.replace('overview', 'timeline')}`)){
                console.log(`timeline_${region}_${ID} alredy exists!`);
                continue;
            }

            fs.writeFileSync(`${files[i].parentPath.replace('overview', 'timeline')}/${files[i].name.replace('overview', 'timeline')}`,'')
            let response = await inst.get(`/lol/match/v5/matches/${region}_${ID}/timeline`);

            console.log(`Game ${response.data['metadata']['matchId']} Found! Found!(${i}/${files.length}) [${Math.floor(i/(files.length/100))}%]`);
    
            if(!fs.existsSync(files[i].parentPath.replace('overview', 'timeline'))){
                fs.mkdirSync(files[i].parentPath.replace('overview', 'timeline'))
            }
            fs.writeFileSync(`${files[i].parentPath.replace('overview', 'timeline')}/${files[i].name.replace('overview', 'timeline')}`, JSON.stringify(response.data))
           
        }catch(error){
            if(!error.response){
                console.error(error)
                return;
            }
            if(error.response.status == 404){
                console.log("idk how this happened lol")
                continue
            }
            if(error.response.status == 400){
                console.log("get a new key");
                return;
            }
            if(error.response.status == 429){
                console.log("overloaded the api whoops!")
                i -= 1;
                continue;
            }

            console.error(error.response.status)

        }
    }
    console.log(`Done!`)
}