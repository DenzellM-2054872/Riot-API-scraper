import axios from 'axios'
import rateLimit from 'axios-rate-limit';
import fs from 'fs';

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
        let allFiles = fs.readdirSync(`${dir}/${patch}/${region}/`);
        allFiles.sort();
        ID = Number(allFiles[0].replace(`overview_${region}_`, "").replace(".json", ""));
    }

    while(true){
        try{
            if (fs.existsSync(`${dir}/${patch}/${region}/overview_${region}_${ID}.json`)){
                console.log(`overview_${region}_${ID} alredy exists!`);
                ID -= 1;
                continue;
            }

            let response = await inst.get(`/lol/match/v5/matches/${region}_${ID}`);
            if(!response.data['info']['gameVersion'].startsWith("15.4")){
                break;
            }
            console.log(`Game ${response.data['metadata']['matchId']} Found!`);
            fs.writeFileSync(`${dir}/${patch}/${region}/overview_${region}_${ID}.json`, JSON.stringify(response.data), {flag: "w"});
            
            ID -= 1;
        }catch(error){
            if(error.response.status == 404){ID -= 1;}
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