// GVTEWAY home — the public event & opportunity discovery/marketplace.
//
// The portal subdomain root (gvteway.atlvs.pro/ → internal /p) had no index
// route, so it 404'd. GVTEWAY's home IS the discovery surface, so /p serves the
// same experience as /p/discover (editorial discovery + scenes + tickets +
// friend activity). Reuses the Discover page component so the two stay in lockstep.
import DiscoverHome from "./discover/page";

export const dynamic = "force-dynamic";

export default DiscoverHome;
