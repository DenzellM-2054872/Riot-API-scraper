import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';
import { cleanW, sortW } from './sort-clean';

export default async function getDown(arg: string, opt: Array<string>){
    const riotToken = fs.readFileSync(opt['token'],'utf8');
    const inst = rateLimit(rateLimit(axios.create(), {maxRPS: 20}), {maxRequests: 100, perMilliseconds:120000});
    inst.defaults.headers.common['X-Riot-Token'] = riotToken;

    let region: string = arg;
    let dir: string = opt['dir'];
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

    if(!fs.existsSync(`${dir}/${patch}`)){
        fs.mkdirSync(`${dir}/${patch}`)
    }

    if(!fs.existsSync(`${dir}/${patch}/${region}`)){
        fs.mkdirSync(`${dir}/${patch}/${region}`)
    }

    let ID = opt['id'];

    if(!ID){
        let content = fs.readdirSync(`${dir}/${patch}/${region}/`, { withFileTypes: true })
        let files = content.filter(dirent => dirent.isFile()).map(dirent => dirent.name);
        const dirs = content.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
        for(let directory of dirs){
            content = fs.readdirSync(`${dir}/${patch}/${region}/${directory}/`, { withFileTypes: true })
            files = files.concat(content.filter(dirent => dirent.isFile()).map(dirent => dirent.name))
        }
        files.sort();
        const last = files.at(-1)
        if(!last) return;
        ID = Number(last.replace(`overview_${region}_`, "").replace(".json", ""));
    }

    while(true){
        try{
            if (fs.existsSync(`${dir}/${patch}/${region}/overview_${region}_${ID}.json`)){
                console.log(`overview_${region}_${ID} alredy exists!`);
                ID += 1;
                continue;
            }

            let response = await inst.get(`/lol/match/v5/matches/${region}_${ID}`);
            if(!response.data['info']['gameVersion'].startsWith("15.4")){
                break;
            }
            console.log(`Game ${response.data['metadata']['matchId']} Found!`);
            sortW(cleanW(response.data), `overview_${region}_${ID}.json`, `${dir}/${patch}/${region}`)
            
            
            ID += 1;
        }catch(error){
            if(error.response.status == 404){ID += 1;}
            if(error.response.status == 401){
                console.log("get a new key");
                return
            }
            if(error.response.status == 429){
            console.log("overloaded the api whoops!")
            }
        }
    }
    console.log(`Done!`)
}