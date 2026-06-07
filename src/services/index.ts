// Data-layer facade. Components import services from here and stay unaware of the source.
// Today: mocks with a random delay. Tomorrow: HTTP to Spring Boot (see TODO in the services).

export { searchService } from "./search.service";
export { catalogService } from "./catalog.service";
export { statsService } from "./stats.service";
export { landingService } from "./landing.service";
export { specialistsService, specialistFacets } from "./specialists.service";
export type { SpecialistFilters, SpecialistSort, SearchFilterSchema, FilterOption, FilterRange } from "./specialists.service";
export { jobsService } from "./jobs.service";
export type { JobFilters } from "./jobs.service";
export { authService } from "./auth.service";
export { messagesService } from "./messages.service";
export { contactsService } from "./contacts.service";
export type { ContactReveal } from "./contacts.service";
export { reviewsService } from "./reviews.service";
export { notificationsService } from "./notifications.service";
export { accountService } from "./account.service";
export { walletService } from "./wallet.service";
export { onboardingService } from "./onboarding.service";
export { portfolioService } from "./portfolio.service";
export type { PortfolioDraft } from "./portfolio.service";
export { legalService } from "./legal.service";
export { supportService } from "./support.service";
export { availabilityService } from "./availability.service";
export { employersService } from "./employers.service";
export { reportsService } from "./reports.service";
export { disputesService } from "./disputes.service";
export type { OpenDisputeDraft } from "./disputes.service";
export { settingsService } from "./settings.service";
export type { NotificationSettings, ConsentChange } from "./settings.service";
export { kycService } from "./kyc.service";
export type { KycStatus } from "./kyc.service";
