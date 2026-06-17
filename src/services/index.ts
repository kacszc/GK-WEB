// Data-layer facade. Components import services from here and stay unaware of the source.
// All services call the Spring Boot backend over HTTP (see @/lib/api-client); legal/support
// content and a few not-yet-built endpoints are the only static data left.

export { searchService } from "./search.service";
export { catalogService } from "./catalog.service";
export { contentService } from "./content.service";
export type { Announcement } from "./content.service";
export { landingService } from "./landing.service";
export { geoService } from "./geo.service";
export type { GeoCity, GeoZone, GeoCitySuggestion } from "./geo.service";
export { alertsService } from "./alerts.service";
export type { JobAlert, AlertDraft } from "./alerts.service";
export { specialistAlertsService } from "./specialistAlerts.service";
export type { SpecialistAlert, SpecialistAlertDraft } from "./specialistAlerts.service";
export { applicationsService, WITHDRAW_REASONS } from "./applications.service";
export type { MyApplication, WithdrawReason } from "./applications.service";
export { certificationsService } from "./certifications.service";
export type { Certification, CertificationDraft } from "./certifications.service";
export { specialistsService } from "./specialists.service";
export type { SpecialistFilters, SpecialistSort, SearchFilterSchema, FilterOption, FilterRange } from "./specialists.service";
export { jobsService } from "./jobs.service";
export type { JobFilters, EditableJob } from "./jobs.service";
export { authService } from "./auth.service";
export { messagesService } from "./messages.service";
export { contactsService } from "./contacts.service";
export type { ContactReveal } from "./contacts.service";
export { reviewsService } from "./reviews.service";
export { notificationsService } from "./notifications.service";
export { accountService } from "./account.service";
export type { MySpecialistProfile, MyEmployerProfile, EmployerProfileUpdate } from "./account.service";
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
