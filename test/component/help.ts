import { hello } from "../app/home";

export function getOutData(params: string) {
  return hello() + " " + params;
}
