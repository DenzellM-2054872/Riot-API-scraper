import fs from 'fs';
import queues from './queues.json'
import pako from 'pako'
    // let zip = pako.deflate(clean(`test.json`))
    // fs.writeFileSync('test-zip.gz', zip,  {encoding: 'utf8', flag: 'w'})
    // let test = fs.readFileSync('test-zip.gz')
    // console.log(pako.inflate(test, { to: 'string' }))

function clean(filePath: string){
    // console.log(filePath)
    let file = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))
    delete file.metadata.dataVersion

    delete file.info.gameId
    delete file.info.gameName

    for (let participant of file.info.participants){
        for (let i = 0; i < 12; i++) {
            delete participant[`PlayerScore${i}`]
        }
        for (let i = 1; i <= 6; i++) {
            delete participant[`playerAugment${i}`]
        }
        for(let challenge in participant.challenges){
            if(participant.challenges[challenge] == 0)
            delete participant.challenges[challenge]
        }

        delete participant.eligibleForProgression

        file.info.gameEndedInEarlySurrender = participant.gameEndedInEarlySurrender
        file.info.gameEndedInSurrender = participant.gameEndedInSurrender
        delete participant.gameEndedInEarlySurrender
        delete participant.gameEndedInSurrender
        delete participant.missions
        delete participant.teamEarlySurrendered

    }

    fs.writeFileSync(filePath, JSON.stringify(file),  {encoding: 'utf8', flag: 'w'})
}

function sort(filePath: string, fileName: string){
    let file = JSON.parse(fs.readFileSync(`${filePath}/${fileName}`, { encoding: 'utf8', flag: 'r' }))
    let queue: string = queues[file.info.queueId].description

    if(!fs.existsSync(`${filePath}/${queue}`)){
        fs.mkdirSync(`${filePath}/${queue}`)
    }
    fs.renameSync(`${filePath}/${fileName}`, `${filePath}/${queue}/${fileName}`)
    // console.log()
}

export default function sortClean(arg: string, opt: Array<string>){
    const dir: string = arg;
    let versions = fs.readdirSync(`${dir}/`);

    for (let version of versions){
        let regions = fs.readdirSync(`${dir}/${version}`); 

        for (let region of regions){
            const basePath = `${dir}/${version}/${region}`
            let content = fs.readdirSync(`${basePath}`, { withFileTypes: true })
            const files = content.filter(dirent => dirent.isFile()).map(dirent => dirent.name);
            for (let file of files){
                clean(`${basePath}/${file}`)
                sort(`${basePath}`, `${file}`)
            }
        }
    }
}