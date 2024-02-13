import { LOGGING_ON } from "./constants";


export function logger(message: string): null {
    // log error messages etc to console
    if(!LOGGING_ON) {
        return
    }
    // get local time
    let local_time = new Date()
    let minutes = local_time.getMinutes().toString().padStart(2, '0')
    let time_string = `${local_time.getHours()}:${minutes}.${local_time.getSeconds()}`
    console.log(`${time_string}: ${message}`)
}
