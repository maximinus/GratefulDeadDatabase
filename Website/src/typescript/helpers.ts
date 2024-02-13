import * as gd from './constants'
import { store } from './database';

// includes all code to clean up data, transform data etc...

export function getYear(days: number): number {
    // get the year of a show date as an integer
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1)
    new_date.setDate(new_date.getDate() + days)
    // now convert to string and return
    let year = new_date.getFullYear().toString().slice(2,4)
    return parseInt(year)
}

export function nth(n: number): string { 
    return['st', 'nd', 'rd'][((n+90)%100-10)%10-1]||'th'
}

export function convertDate(days: number): string {
    // convert to date format "13th Oct 73" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1)
    new_date.setDate(new_date.getDate() + days)
    // now convert to string and return
    let day = new_date.getDate()
    let month = new_date.toLocaleString('default', { month: 'short' })
    let year = new_date.getFullYear().toString().slice(2,4)
    // calculate st/nd/rd/th
    let day_ending = nth(day)
    return `${day}${day_ending} ${month} ${year}`
}

export function convertDateLong(days: number): string {
    // convert to date format "13th October 1973" or similar
    // the value sent is an int: number of days since 1st Jan 1950
    let new_date = new Date(1950, 0, 1)
    new_date.setDate(new_date.getDate() + days)
    // now convert to string and return
    let day = new_date.getDate()
    let month = new_date.toLocaleString('default', { month: 'long' })
    let year = new_date.getFullYear().toString()
    // calculate st/nd/rd/th
    let day_ending = nth(day)
    return `${day}${day_ending} ${month} ${year}`
}

export function convertDateStringFromDate(single_date: Date): string {
    let day = single_date.getDate()
    let month = single_date.toLocaleString('default', { month: 'long' })
    let year = single_date.getFullYear().toString()
    // calculate st/nd/rd/th
    let day_ending = nth(day)
    return `${day}${day_ending} ${month} ${year}`
}

export function convertToLink(str: string, url: string): string {
    // convert given string to a link
    return `<a href="#gdd-${url}">${str}</a>`
}

export function getRealDate(days: number): Date {
    // convert from given day to real data
    let new_date = new Date(1950, 0, 1)
    new_date.setDate(new_date.getDate() + days)
    return new_date
}

export function convertFromDate(show_date: Date): number {
    // do the opposite of above - convert date back to number
    let new_date = new Date(1950, 0 ,1)
    let diff = show_date.getTime() - new_date.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
}

export function getActualDay(show_date: Date): string {
    // given a real date, find out what day it really was
    return gd.WEEKDAYS[show_date.getDay()]
}

export function convertTime(total_time: number): string {
    // convert to some time in format "4m 17s"
    // return hours if they exist - this is for show length
    let hours = 0
    if(total_time > 3600) {
        hours = Math.floor(total_time / 3600)
        total_time -= hours * 3600
    }
    let minutes = Math.floor(total_time / 60)
    let seconds = total_time - (minutes * 60)
    if(hours != 0) {
        return `${hours}h ${minutes}m ${seconds}s`
    }
    if(minutes == 0) {
        return `${seconds}s`
    }
    return `${minutes}m ${seconds}s`
}

export function makePrettyNumber(value: number): string {
    // return as a string, and of the form 1,000 if needed
    if(value > 999) {
        let txt = value.toString()
        return `${txt.slice(0, -3)},${txt.slice(-3)}`
    }
    // just as normal
    return value.toString()
}

export function dayDays(delta: number): string {
    if(delta < 2) {
        return `${delta} day`
    }
    return `${delta} days`
}

export function getSetName(index: number): string {
    return gd.SET_NAMES[index]
}

export function getSongName(index: number): string {
    // get the name of the song at this index, check for errors
    if(index >= store.songs.length) {
        return "Index too high"
    }
    return store.songs[index]
}

export function songNametoSlug(song_name: string) {
    // song_name is a string, adjust
    return song_name.split(' ').join('-')
}

export function dateToSlug(date: Date): string {
    let day = date.getDate();
    let month = gd.MONTHS[date.getMonth()]
    let year = date.getFullYear()
    return `${day}-${month}-${year}`
}

export function dateDifference(starting_date: Date, ending_date: Date): string {
    let start_date = new Date(new Date(starting_date).toISOString().substring(0, 10))
    if (!ending_date) {
        // TODO: clarify what this does
        // this must mean now ??
        // ending_date = new Date().toISOString().substring(0, 10)
        ending_date = new Date()
    }
    let end_date = new Date(ending_date)
    if (start_date > end_date) {
        let swap = start_date
        start_date = end_date
        end_date = swap
    }
    let startYear = start_date.getFullYear()
    let february = (startYear % 4 === 0 && startYear % 100 !== 0) || startYear % 400 === 0 ? 29 : 28
    let daysInMonth = [31, february, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    let yearDiff = end_date.getFullYear() - startYear
    let monthDiff = end_date.getMonth() - start_date.getMonth()
    if (monthDiff < 0) {
        yearDiff--
        monthDiff += 12
    }
    let dayDiff = end_date.getDate() - start_date.getDate()
    if (dayDiff < 0) {
        if (monthDiff > 0) {
            monthDiff--
        } else {
            yearDiff--
            monthDiff = 11
        }
        dayDiff += daysInMonth[start_date.getMonth()]
    }
    return `${yearDiff} years, ${monthDiff} months, ${dayDiff} days`
}

export function convertTemp(t: number): number {
    // convert from the format in the binary
    // subtract 1
    let real_t = t - 1.0
    // divide by 10
    real_t = real_t / 10.0
    // subtract 50
    real_t -= 50.0
    return real_t
}

export function convertPrecip(p: number): number {
    let float_precip = (p - 1.0) / 10000.0
    return float_precip
}

export function convertDateOptionFormat(date_text: string): Date | null {
    // given this text input, does it match with a real date?
    // If so, return the date, else return null
    // check it also exists within the years
    let date_split = date_text.split('-')
    if(date_split.length != 3) {
        return null;
    }
    // check we can parse the ints
    if(!date_split.some(x => !Number.isInteger(x))) {
        // something wasn't an integer
        return null
    }
    let date_array = date_split.map(x => parseInt(x))
    // assume DATE_FORMAT_DDMMYY
    let day = date_array[0]
    let month = date_array[1]
    let year = date_array[2]
    if(store.options.date_format == gd.DATE_FORMAT_MMDDYY) {
        day = date_array[1]
        month = date_array[0]
    }
    if(store.options.date_format == gd.DATE_FORMAT_YYMMDD) {
        year = date_array[0]
        day = date_array[2]
    }
    // now try and get a date - default format is "MM/DD/YYYY"
    // we'll need to try with adding the "19" part ourself
    let this_extended_date = new Date(year + 1900, month - 1, day)
    if(this_extended_date.toString() != "Invalid Date") {
        // check in range
        let year_value = this_extended_date.getFullYear()
        if((year_value >= gd.START_YEAR) && (year_value <= gd.END_YEAR)) {
            return this_extended_date
        }
    }
    // try the same, but don't add the 18
    let this_date = new Date(year, month - 1, day)
    if(this_date.toString() != "Invalid Date") {
        let year_value = this_date.getFullYear()
        if((year_value >= gd.START_YEAR) && (year_value <= gd.END_YEAR)) {
            return this_date
        }
    }
    // no dates matched
    return null
}
