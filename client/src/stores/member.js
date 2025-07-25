import {api} from './api'
import {get, writable} from 'svelte/store'


export const memberEmails = writable([])
export const memberNames = writable([])
export const sciMembers = writable([])

export async function getMembers(page) {
    try {
        const result = await api.post('/members/', {page: page, limit: 50})
        return result.data
    } catch (error) {}
}

export async function getSciMembers() {
    try {
        const result = await api.get('/members/sci')
        sciMembers.set(result.data)
    } catch (error) {}
}

export async function getMemberByEmail(email) {
    try {
        const result = await api.post('/members/byEmail', {email: email})
        return result.data[0]
    } catch (error) {}
}

export async function getMemberById(id) {
    try {
        const result = await api.get('/member/'+id)
        return result.data
    } catch (error) {}
}

export async function getMemberByName(name) {
    try {
        const result = await api.post('/members/byName/', {name: name})
        return result.data
    } catch (error) {}
}

export async function getMemberEmails() {
    try {
        const result = await api.get('/memberEmails/')
        memberEmails.set(result.data)
    } catch (error) {}
}

export async function getNewsletterEmails(date) {
    try {
        const result = await api.post('/newsletterEmails/', {date: date})
        return result.data
    } catch (error) {}
}

export async function getMemberNames() {
    try {
        const result = await api.get('/members/')
        memberNames.set(result.data)
    } catch (error) {}
}

export async function createMember(member) {
    try {
        const result = await api.post('/member/', member)
        return result.status === 200
    } catch (error) {}
}

export async function updateMember(member) {
    try {
        const result = await api.put('/member/'+member.id, member)
        return result.status === 200
    } catch (error) {}
}

export function getSciMember(id) {
    return get(sciMembers).find(m => m.id === id)
}

export const countryArray = [
    {title: "Afghanistan", value: "AF"},
    {title: "Åland Islands", value: "AX"},
    {title: "Albania", value: "AL"},
    {title: "Algeria", value: "DZ"},
    {title: "American Samoa", value: "AS"},
    {title: "Andorra", value: "AD"},
    {title: "Angola", value: "AO"},
    {title: "Anguilla", value: "AI"},
    {title: "Antarctica", value: "AQ"},
    {title: "Antigua and Barbuda", value: "AG"},
    {title: "Argentina", value: "AR"},
    {title: "Armenia", value: "AM"},
    {title: "Aruba", value: "AW"},
    {title: "Australia", value: "AU"},
    {title: "Austria", value: "AT"},
    {title: "Azerbaijan", value: "AZ"},
    {title: "Bahamas", value: "BS"},
    {title: "Bahrain", value: "BH"},
    {title: "Bangladesh", value: "BD"},
    {title: "Barbados", value: "BB"},
    {title: "Belarus", value: "BY"},
    {title: "Belgium", value: "BE"},
    {title: "Belize", value: "BZ"},
    {title: "Benin", value: "BJ"},
    {title: "Bermuda", value: "BM"},
    {title: "Bhutan", value: "BT"},
    {title: "Bolivia", value: "BO"},
    {title: "Bosnia and Herzegovina", value: "BA"},
    {title: "Botswana", value: "BW"},
    {title: "Bouvet Island", value: "BV"},
    {title: "Brazil", value: "BR"},
    {title: "British Indian Ocean Territory", value: "IO"},
    {title: "Brunei Darussalam", value: "BN"},
    {title: "Bulgaria", value: "BG"},
    {title: "Burkina Faso", value: "BF"},
    {title: "Burundi", value: "BI"},
    {title: "Cambodia", value: "KH"},
    {title: "Cameroon", value: "CM"},
    {title: "Canada", value: "CA"},
    {title: "Cape Verde", value: "CV"},
    {title: "Cayman Islands", value: "KY"},
    {title: "Central African Republic", value: "CF"},
    {title: "Chad", value: "TD"},
    {title: "Chile", value: "CL"},
    {title: "China", value: "CN"},
    {title: "Christmas Island", value: "CX"},
    {title: "Cocos (Keeling) Islands", value: "CC"},
    {title: "Colombia", value: "CO"},
    {title: "Comoros", value: "KM"},
    {title: "Congo", value: "CG"},
    {title: "Congo, The Democratic Republic of the", value: "CD"},
    {title: "Cook Islands", value: "CK"},
    {title: "Costa Rica", value: "CR"},
    {title: "Cote D'Ivoire", value: "CI"},
    {title: "Croatia", value: "HR"},
    {title: "Cuba", value: "CU"},
    {title: "Cyprus", value: "CY"},
    {title: "Czech Republic", value: "CZ"},
    {title: "Denmark", value: "DK"},
    {title: "Djibouti", value: "DJ"},
    {title: "Dominica", value: "DM"},
    {title: "Dominican Republic", value: "DO"},
    {title: "Ecuador", value: "EC"},
    {title: "Egypt", value: "EG"},
    {title: "El Salvador", value: "SV"},
    {title: "Equatorial Guinea", value: "GQ"},
    {title: "Eritrea", value: "ER"},
    {title: "Estonia", value: "EE"},
    {title: "Ethiopia", value: "ET"},
    {title: "Falkland Islands (Malvinas)", value: "FK"},
    {title: "Faroe Islands", value: "FO"},
    {title: "Fiji", value: "FJ"},
    {title: "Finland", value: "FI"},
    {title: "France", value: "FR"},
    {title: "French Guiana", value: "GF"},
    {title: "French Polynesia", value: "PF"},
    {title: "French Southern Territories", value: "TF"},
    {title: "Gabon", value: "GA"},
    {title: "Gambia", value: "GM"},
    {title: "Georgia", value: "GE"},
    {title: "Germany", value: "DE"},
    {title: "Ghana", value: "GH"},
    {title: "Gibraltar", value: "GI"},
    {title: "Greece", value: "GR"},
    {title: "Greenland", value: "GL"},
    {title: "Grenada", value: "GD"},
    {title: "Guadeloupe", value: "GP"},
    {title: "Guam", value: "GU"},
    {title: "Guatemala", value: "GT"},
    {title: "Guernsey", value: "GG"},
    {title: "Guinea", value: "GN"},
    {title: "Guinea-Bissau", value: "GW"},
    {title: "Guyana", value: "GY"},
    {title: "Haiti", value: "HT"},
    {title: "Heard Island and Mcdonald Islands", value: "HM"},
    {title: "Holy See (Vatican City State)", value: "VA"},
    {title: "Honduras", value: "HN"},
    {title: "Hong Kong", value: "HK"},
    {title: "Hungary", value: "HU"},
    {title: "Iceland", value: "IS"},
    {title: "India", value: "IN"},
    {title: "Indonesia", value: "ID"},
    {title: "Iran, Islamic Republic Of", value: "IR"},
    {title: "Iraq", value: "IQ"},
    {title: "Ireland", value: "IE"},
    {title: "Isle of Man", value: "IM"},
    {title: "Israel", value: "IL"},
    {title: "Italy", value: "IT"},
    {title: "Jamaica", value: "JM"},
    {title: "Japan", value: "JP"},
    {title: "Jersey", value: "JE"},
    {title: "Jordan", value: "JO"},
    {title: "Kazakhstan", value: "KZ"},
    {title: "Kenya", value: "KE"},
    {title: "Kiribati", value: "KI"},
    {title: "Korea, Democratic People's Republic of", value: "KP"},
    {title: "Korea, Republic of", value: "KR"},
    {title: "Kuwait", value: "KW"},
    {title: "Kyrgyzstan", value: "KG"},
    {title: "Lao People's Democratic Republic", value: "LA"},
    {title: "Latvia", value: "LV"},
    {title: "Lebanon", value: "LB"},
    {title: "Lesotho", value: "LS"},
    {title: "Liberia", value: "LR"},
    {title: "Libyan Arab Jamahiriya", value: "LY"},
    {title: "Liechtenstein", value: "LI"},
    {title: "Lithuania", value: "LT"},
    {title: "Luxembourg", value: "LU"},
    {title: "Macao", value: "MO"},
    {title: "Macedonia, The Former Yugoslav Republic of", value: "MK"},
    {title: "Madagascar", value: "MG"},
    {title: "Malawi", value: "MW"},
    {title: "Malaysia", value: "MY"},
    {title: "Maldives", value: "MV"},
    {title: "Mali", value: "ML"},
    {title: "Malta", value: "MT"},
    {title: "Marshall Islands", value: "MH"},
    {title: "Martinique", value: "MQ"},
    {title: "Mauritania", value: "MR"},
    {title: "Mauritius", value: "MU"},
    {title: "Mayotte", value: "YT"},
    {title: "Mexico", value: "MX"},
    {title: "Micronesia, Federated States of", value: "FM"},
    {title: "Moldova, Republic of", value: "MD"},
    {title: "Monaco", value: "MC"},
    {title: "Mongolia", value: "MN"},
    {title: "Montserrat", value: "MS"},
    {title: "Morocco", value: "MA"},
    {title: "Mozambique", value: "MZ"},
    {title: "Myanmar", value: "MM"},
    {title: "Namibia", value: "NA"},
    {title: "Nauru", value: "NR"},
    {title: "Nepal", value: "NP"},
    {title: "Netherlands", value: "NL"},
    {title: "Netherlands Antilles", value: "AN"},
    {title: "New Caledonia", value: "NC"},
    {title: "New Zealand", value: "NZ"},
    {title: "Nicaragua", value: "NI"},
    {title: "Niger", value: "NE"},
    {title: "Nigeria", value: "NG"},
    {title: "Niue", value: "NU"},
    {title: "Norfolk Island", value: "NF"},
    {title: "Northern Mariana Islands", value: "MP"},
    {title: "Norway", value: "NO"},
    {title: "Oman", value: "OM"},
    {title: "Pakistan", value: "PK"},
    {title: "Palau", value: "PW"},
    {title: "Palestinian Territory, Occupied", value: "PS"},
    {title: "Panama", value: "PA"},
    {title: "Papua New Guinea", value: "PG"},
    {title: "Paraguay", value: "PY"},
    {title: "Peru", value: "PE"},
    {title: "Philippines", value: "PH"},
    {title: "Pitcairn", value: "PN"},
    {title: "Poland", value: "PL"},
    {title: "Portugal", value: "PT"},
    {title: "Puerto Rico", value: "PR"},
    {title: "Qatar", value: "QA"},
    {title: "Reunion", value: "RE"},
    {title: "Romania", value: "RO"},
    {title: "Russian Federation", value: "RU"},
    {title: "RWANDA", value: "RW"},
    {title: "Saint Helena", value: "SH"},
    {title: "Saint Kitts and Nevis", value: "KN"},
    {title: "Saint Lucia", value: "LC"},
    {title: "Saint Pierre and Miquelon", value: "PM"},
    {title: "Saint Vincent and the Grenadines", value: "VC"},
    {title: "Samoa", value: "WS"},
    {title: "San Marino", value: "SM"},
    {title: "Sao Tome and Principe", value: "ST"},
    {title: "Saudi Arabia", value: "SA"},
    {title: "Senegal", value: "SN"},
    {title: "Serbia and Montenegro", value: "CS"},
    {title: "Seychelles", value: "SC"},
    {title: "Sierra Leone", value: "SL"},
    {title: "Singapore", value: "SG"},
    {title: "Slovakia", value: "SK"},
    {title: "Slovenia", value: "SI"},
    {title: "Solomon Islands", value: "SB"},
    {title: "Somalia", value: "SO"},
    {title: "South Africa", value: "ZA"},
    {title: "South Georgia and the South Sandwich Islands", value: "GS"},
    {title: "Spain", value: "ES"},
    {title: "Sri Lanka", value: "LK"},
    {title: "Sudan", value: "SD"},
    {title: "Suriname", value: "SR"},
    {title: "Svalbard and Jan Mayen", value: "SJ"},
    {title: "Swaziland", value: "SZ"},
    {title: "Sweden", value: "SE"},
    {title: "Switzerland", value: "CH"},
    {title: "Syrian Arab Republic", value: "SY"},
    {title: "Taiwan, Province of China", value: "TW"},
    {title: "Tajikistan", value: "TJ"},
    {title: "Tanzania, United Republic of", value: "TZ"},
    {title: "Thailand", value: "TH"},
    {title: "Timor-Leste", value: "TL"},
    {title: "Togo", value: "TG"},
    {title: "Tokelau", value: "TK"},
    {title: "Tonga", value: "TO"},
    {title: "Trinidad and Tobago", value: "TT"},
    {title: "Tunisia", value: "TN"},
    {title: "Turkey", value: "TR"},
    {title: "Turkmenistan", value: "TM"},
    {title: "Turks and Caicos Islands", value: "TC"},
    {title: "Tuvalu", value: "TV"},
    {title: "Uganda", value: "UG"},
    {title: "Ukraine", value: "UA"},
    {title: "United Arab Emirates", value: "AE"},
    {title: "United Kingdom", value: "GB"},
    {title: "United States of America", value: "US"},
    {title: "United States Minor Outlying Islands", value: "UM"},
    {title: "Uruguay", value: "UY"},
    {title: "Uzbekistan", value: "UZ"},
    {title: "Vanuatu", value: "VU"},
    {title: "Venezuela", value: "VE"},
    {title: "Vietnam", value: "VN"},
    {title: "Virgin Islands, British", value: "VG"},
    {title: "Virgin Islands, U.S.", value: "VI"},
    {title: "Wallis and Futuna", value: "WF"},
    {title: "Western Sahara", value: "EH"},
    {title: "Yemen", value: "YE"},
    {title: "Zambia", value: "ZM"},
    {title: "Zimbabwe", value: "ZW"}
]