/**
 * Domain Alias Mapping
 * Maps commonly used domain names to their actual domains and subdomains
 */

interface DomainAliases {
    [key: string]: string[];
}

export const DOMAIN_ALIASES: DomainAliases = {
    // Google Services
    "gmail.com": ["mail.google.com", "gmail.com"],
    "mail.google.com": ["mail.google.com", "gmail.com"],
    "google.com": ["google.com", "www.google.com"],
    "drive.google.com": ["drive.google.com", "docs.google.com"],
    "youtube.com": ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    "youtu.be": ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],

    // Social Media
    "twitter.com": ["twitter.com", "x.com", "mobile.twitter.com"],
    "x.com": ["twitter.com", "x.com", "mobile.twitter.com"],
    "facebook.com": ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com"],
    "fb.com": ["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com"],
    "instagram.com": ["instagram.com", "www.instagram.com"],
    "linkedin.com": ["linkedin.com", "www.linkedin.com"],
    "reddit.com": ["reddit.com", "www.reddit.com", "old.reddit.com"],
    "tiktok.com": ["tiktok.com", "www.tiktok.com"],

    // Microsoft Services
    "outlook.com": ["outlook.office.com", "outlook.live.com", "outlook.com"],
    "office.com": ["office.com", "www.office.com", "office365.com"],
    "teams.microsoft.com": ["teams.microsoft.com", "teams.live.com"],

    // Development
    "github.com": ["github.com", "www.github.com", "gist.github.com"],
    "stackoverflow.com": ["stackoverflow.com", "www.stackoverflow.com"],
    "gitlab.com": ["gitlab.com", "www.gitlab.com"],
    "bitbucket.org": ["bitbucket.org", "www.bitbucket.org"],

    // Productivity
    "notion.so": ["notion.so", "www.notion.so"],
    "trello.com": ["trello.com", "www.trello.com"],
    "slack.com": ["slack.com", "app.slack.com"],
    "discord.com": ["discord.com", "www.discord.com", "discordapp.com"],
    "zoom.us": ["zoom.us", "www.zoom.us"],

    // News & Media
    "medium.com": ["medium.com", "www.medium.com"],
    "substack.com": ["substack.com", "www.substack.com"],

    // E-commerce
    "amazon.com": ["amazon.com", "www.amazon.com"],
    "ebay.com": ["ebay.com", "www.ebay.com"],

    // Streaming
    "netflix.com": ["netflix.com", "www.netflix.com"],
    "spotify.com": ["spotify.com", "open.spotify.com"],
    "twitch.tv": ["twitch.tv", "www.twitch.tv"],

    // Cloud Storage
    "dropbox.com": ["dropbox.com", "www.dropbox.com"],
    "onedrive.live.com": ["onedrive.live.com", "onedrive.com"],

    // Communication
    "whatsapp.com": ["web.whatsapp.com", "whatsapp.com"],
    "telegram.org": ["web.telegram.org", "telegram.org"],
};

/**
 * Expands a domain to include all its known aliases
 * @param domain - The domain to expand
 * @returns Array of domains including the original and all aliases
 */
export function expandDomain(domain: string): string[] {
    const cleanDomain = domain
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .toLowerCase();

    // Check if domain has known aliases
    if (DOMAIN_ALIASES[cleanDomain]) {
        return DOMAIN_ALIASES[cleanDomain];
    }

    // Check if this domain is an alias of another domain
    for (const [_key, aliases] of Object.entries(DOMAIN_ALIASES)) {
        if (aliases.includes(cleanDomain)) {
            return aliases;
        }
    }

    // Return original domain if no aliases found
    return [cleanDomain];
}

/**
 * Expands a whitelist to include all domain aliases
 * @param whitelist - Array of domains
 * @returns Expanded array with all aliases, deduplicated
 */
export function expandWhitelist(whitelist: string[]): string[] {
    const expanded = new Set<string>();

    whitelist.forEach((domain) => {
        const aliases = expandDomain(domain);
        aliases.forEach((alias) => expanded.add(alias));
    });

    return Array.from(expanded);
}
