import { CompletedJobsHistory } from "@/components/account/CompletedJobsHistory";

// Completed-jobs history is available to both roles (employer + specialist).
export default function Page() {
  return <CompletedJobsHistory />;
}
