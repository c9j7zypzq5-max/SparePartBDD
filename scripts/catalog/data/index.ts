import type { IngestPart } from "../../../src/lib/ingest-types";
import { abb } from "./abb";
import { apc } from "./apc";
import { beckhoff } from "./beckhoff";
import { cisco } from "./cisco";
import { eaton } from "./eaton";
import { fortinet } from "./fortinet";
import { hpe } from "./hpe";
import { instruments } from "./instruments";
import { juniper } from "./juniper";
import { mitsubishi } from "./mitsubishi";
import { omron } from "./omron";
import { phoenix } from "./phoenix";
import { pneumatics } from "./pneumatics";
import { rockwell } from "./rockwell";
import { schneider } from "./schneider";
import { siemens } from "./siemens";
import { storage } from "./storage";
import { wago } from "./wago";

/** Catalogue étendu complet : automatismes industriels d'abord, puis informatique. */
export const CATALOGUE: IngestPart[] = [
  ...siemens,
  ...schneider,
  ...abb,
  ...rockwell,
  ...omron,
  ...mitsubishi,
  ...beckhoff,
  ...wago,
  ...phoenix,
  ...eaton,
  ...pneumatics,
  ...instruments,
  ...cisco,
  ...juniper,
  ...fortinet,
  ...apc,
  ...hpe,
  ...storage,
];
