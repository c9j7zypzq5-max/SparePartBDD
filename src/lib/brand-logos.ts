const BRAND_DOMAINS: Record<string, string> = {
  "siemens": "siemens.com",
  "schneider-electric": "se.com",
  "abb": "abb.com",
  "rockwell-automation": "rockwellautomation.com",
  "festo": "festo.com",
  "smc": "smcworld.com",
  "omron": "omron.com",
  "phoenix-contact": "phoenixcontact.com",
  "keysight": "keysight.com",
  "fluke": "fluke.com",
  "wago": "wago.com",
  "danfoss": "danfoss.com",
  "lenze": "lenze.com",
  "sew-eurodrive": "sew-eurodrive.com",
  "mitsubishi-electric": "mitsubishielectric.com",
  "beckhoff": "beckhoff.com",
  "cisco": "cisco.com",
  "juniper-networks": "juniper.net",
  "dell": "dell.com",
  "hpe": "hpe.com",
  "lenovo": "lenovo.com",
  "fortinet": "fortinet.com",
  "aruba": "arubanetworks.com",
  "ubiquiti": "ui.com",
  "synology": "synology.com",
  "qnap": "qnap.com",
  "apc": "apc.com",
};

export function getBrandLogoUrl(slug: string): string | null {
  const domain = BRAND_DOMAINS[slug];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}
