// Data-layer facade. Components import services from here and stay unaware of the source.
// Today: mocks with a random delay. Tomorrow: HTTP to Spring Boot (see TODO in the services).

export { searchService } from "./search.service";
export { catalogService } from "./catalog.service";
export { statsService } from "./stats.service";
export { specialistsService, specialistFacets } from "./specialists.service";
export type { SpecialistFilters, SpecialistSort } from "./specialists.service";
export { jobsService } from "./jobs.service";
export { authService } from "./auth.service";
