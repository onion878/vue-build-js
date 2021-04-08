import {getOutData} from './help'

export function getName(): string {
    return "My name is  Onion" + getOutData("list");
}