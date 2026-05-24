/**
 * SITEPLAN Band Vocabulary — protocol §6.
 *
 * The blue line / orange line in the Salvage City sheet are not arbitrary
 * colors. They are instances of a closed enum of band types. Every linear
 * surface that can hold equipment or stations in any SITEPLAN plan is
 * one of these — new band types enter via UWCP, never inline.
 */

import type { SitePlanBandType } from "./types";

export type BandMeta = {
  token: string;
  defaultColor: string;
  label: string;
  typicalUse: string;
};

export const BAND_VOCAB: Record<SitePlanBandType, BandMeta> = {
  appliance: {
    token: "band.appliance",
    defaultColor: "#1d4ed8",
    label: "Appliance",
    typicalUse: "Powered fixed equipment line",
  },
  service: {
    token: "band.service",
    defaultColor: "#ea580c",
    label: "Service",
    typicalUse: "Worker-side tables, prep, plate, expo",
  },
  bar: {
    token: "band.bar",
    defaultColor: "#d97706",
    label: "Bar",
    typicalUse: "Bar service line with ice wells, speed rails",
  },
  display: {
    token: "band.display",
    defaultColor: "#be185d",
    label: "Display",
    typicalUse: "Retail / merch / activation surfaces",
  },
  cold_rail: {
    token: "band.cold_rail",
    defaultColor: "#0e7490",
    label: "Cold Rail",
    typicalUse: "Refrigerated linear (sushi, salad)",
  },
  hot_rail: {
    token: "band.hot_rail",
    defaultColor: "#b91c1c",
    label: "Hot Rail",
    typicalUse: "Steam tables, induction line",
  },
  queue: {
    token: "band.queue",
    defaultColor: "#525252",
    label: "Queue",
    typicalUse: "Stanchion lanes, line management",
  },
  bench: {
    token: "band.bench",
    defaultColor: "#65a30d",
    label: "Bench",
    typicalUse: "Seating / dwell",
  },
  tech: {
    token: "band.tech",
    defaultColor: "#6d28d9",
    label: "Tech",
    typicalUse: "FOH, dimmer, audio rack lines",
  },
  barricade: {
    token: "band.barricade",
    defaultColor: "#0a0a0a",
    label: "Barricade",
    typicalUse: "Crowd-control hard line",
  },
};
