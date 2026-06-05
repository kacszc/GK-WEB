import type { Dictionary } from "./pl";

const en: Dictionary = {
  nav: {
    pricing: "Pricing",
    howItWorks: "How it works",
    addJob: "Post a job",
    login: "Log in",
    register: "Sign up",
  },
  hero: {
    toggleWorker: "I'm hiring",
    toggleJob: "Looking for work",
  },
  search: {
    placeholder: "Type a job, specialization or skill…",
    examples: ["Bartender", "Waiter", "Electrician", "Driver C+E", "Cleaning"],
    cta: "Search",
  },
  filters: {
    when: "WHEN",
    today: "Today",
    tomorrow: "Tomorrow",
    weekend: "Weekend",
    where: "WHERE",
    location: "LOCATION",
    locationPlaceholder: "City or district",
    radius: "RADIUS",
    upTo: "up to {km} km",
  },
  dropdown: {
    suggested: "SUGGESTED SPECIALIZATIONS",
    openMap: "Open map",
    searching: "SEARCHING…",
    noResults: "No results for “{query}”",
    noResultsHint: "Try another job or specialization.",
  },
  mode: {
    worker: {
      title: "Who do you need today?",
      subtitleLoading: "Searching available specialists…",
      subtitleEmpty: "Type to see available specialists",
      subtitleResults: "Live · {count} specialists available NOW",
      availableNow: "{count} available NOW",
      itemsCount: "{count} specialists available",
      nearby: "CLOSEST TO YOU RIGHT NOW",
      showAll: "Show all {count} results",
    },
    job: {
      title: "What job are you looking for today?",
      subtitleLoading: "Searching available jobs…",
      subtitleEmpty: "Type to see available jobs",
      subtitleResults: "Live · {count} jobs available NOW",
      availableNow: "{count} available NOW",
      itemsCount: "{count} matching jobs",
      nearby: "JOBS CLOSEST TO YOU",
      showAll: "Show all {count} results",
    },
  },
  chips: {
    heading: "ONE CLICK · POPULAR",
    now: "NOW",
  },
  actions: {
    heading: "One-click actions",
    liveBadge: "{count} PEOPLE AVAILABLE NOW",
    searchTitle: "Find a specialist",
    searchDesc:
      "247 people NOW in Warsaw. Trust Score, ratings, certificates — all in one view.",
    searchCta: "Open search",
    mapTitle: "See on the map",
    mapDesc:
      "Just-in-Eat-style: pins on the map, hover = preview, click = profile. 47-people mode.",
    mapCta: "Open map",
    jobTitle: "Post a job",
    jobDesc:
      "2 minutes. Your job will be seen by 247 available specialists — first replies in minutes.",
    jobCta: "Create a job",
  },
  popular: {
    label: "RECENTLY POPULAR",
    sublabel: "Most searched specializations in Warsaw · last 24h",
    trendingTitle: "Most searched",
    last24h: "last 24h",
    liveTitle: "Now on skill.com",
    live: "live",
  },
  trust: {
    using: "Already using us:",
    employers: "{n}+ employers",
    specialists: "{n}+ verified specialists",
    ratings: "{n}% positive ratings",
    badges: ["GUS API", "KYC verification", "Trust Score", "Polish companies", "No commission on jobs"],
  },
  footer: {
    description:
      "A trusted platform connecting employers with verified specialists in Poland.",
    columns: [
      { title: "PLATFORM", links: ["How it works", "Pricing", "Trust Score", "Security", "API"] },
      { title: "FOR EMPLOYERS", links: ["Post a job", "Find a specialist", "Job boosts", "Enterprise plans"] },
      { title: "FOR SPECIALISTS", links: ["Create a profile", "PRO subscription", "Profile boosts", "KYC verification"] },
      { title: "COMPANY", links: ["About us", "Contact", "Careers at skill.com", "Blog", "Help"] },
    ],
    legal: ["Terms", "Privacy policy", "Cookies", "GDPR"],
    copyright: "© 2026 skill.com sp. z o.o. · VAT PL5252999999 · Marszałkowska 1, Warsaw",
  },
  language: {
    label: "Language",
  },
  meta: {
    title: "skill.com — Who do you need today?",
    description:
      "A marketplace connecting employers with verified specialists. Find a pro available now near you.",
  },
};

export default en;
