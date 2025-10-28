/**
 * RudderStack Tracking System
 * 
 * Environment Variables:
 * - RUDDERSTACK_KEY: RudderStack write key
 * - RUDDERSTACK_URL: RudderStack data plane URL
 * - RUDDERSTACK_GAME_ID: Game identifier
 * - RUDDERSTACK_PROJECT_ID: Project identifier
 * - RUDDERSTACK_LOG: Enable logging (true/false)
 * - RUDDERSTACK_TRACKED_PAGES: Comma-separated list of pages to track
 *   Example: "/,/tim-kiem,/xem-truoc,/[slug]"
 */
'use client';
import { RudderAnalytics } from "@rudderstack/analytics-js";

const common_properties = {
  game_id: process.env.RUDDERSTACK_GAME_ID || null,
  project_id: process.env.RUDDERSTACK_PROJECT_ID || null,
};

// Mảng các URL cần tracking từ environment variables
const trackedPages = process.env.RUDDERSTACK_TRACKED_PAGES 
  ? process.env.RUDDERSTACK_TRACKED_PAGES.split(',').map(page => page.trim())
  : [];

const showLog = process.env.RUDDERSTACK_LOG === "true";
if (showLog) {
  console.log("RudderStack Logging is enabled");
  console.log("Tracked pages source:", process.env.RUDDERSTACK_TRACKED_PAGES ? "environment" : "default");
  console.log("Tracked pages:", trackedPages);
}

class RudderStackTracker {
  private static instance: RudderStackTracker | null = null;
  private static isPageTrackingSetup = false;
  private analyticsInstance: RudderAnalytics;
  private trackedElements = new Set<HTMLElement>();
  private mutationObserver: MutationObserver | null = null;
  private originalPushState!: typeof history.pushState;
  private originalReplaceState!: typeof history.replaceState;
  private popstateHandler: (() => void) | null = null;
  private isInitialized = false;

  private constructor() {
    this.analyticsInstance = new RudderAnalytics();
  }

  public static getInstance(): RudderStackTracker {
    if (!RudderStackTracker.instance) {
      RudderStackTracker.instance = new RudderStackTracker();
    }
    return RudderStackTracker.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      if (showLog) {
        console.warn("RudderStack already initialized, skipping...");
      }
      return false;
    }

    // Check for required environment variables
    if (!process.env.RUDDERSTACK_KEY || !process.env.RUDDERSTACK_URL) {
      if (showLog) {
        console.error(
          "RudderStack key or URL is not defined in environment variables."
        );
      }
      return false;
    }

    // Initialize RudderStack
    if (!common_properties.game_id || !common_properties.project_id) {
      if (showLog) {
        console.warn(
          "RudderStack game ID or project ID is not defined in environment variables."
        );
      }
    }

    this.analyticsInstance.load(
      process.env.RUDDERSTACK_KEY,
      process.env.RUDDERSTACK_URL
    );

    // Wait until RudderStack is ready
    return new Promise((resolve) => {
      this.analyticsInstance.ready(() => {
        if (showLog) {
          console.log("RudderStack is ready");
        }

        // Only setup if not already initialized
        if (!this.isInitialized) {
          this.setupPageTracking();
          this.setupObserver();
          this.isInitialized = true;
        }

        resolve(true);
      });
    });
  }

  private trackPageView = (
    url: string = window.location.href,
    source: string = "unknown"
  ) => {
    const pathname = new URL(url).pathname;

    // Kiểm tra xem pathname có trong danh sách cần tracking không
    const shouldTrack = trackedPages.some(page => {
      // Exact match cho các route cố định
      if (page === pathname) return true;
      
      // Pattern matching cho dynamic routes
      if (pathname.startsWith("/") && pathname.match(/^\/[^\/]+$/)) {
        // Match dynamic routes như /[slug]
        return trackedPages.includes("/[slug]");
      }
      
      return false;
    });

    if (!shouldTrack) {
      if (showLog) {
        console.log(
          `Skipping page tracking for: ${pathname} (not in tracked pages list)`
        );
      }
      return;
    }

    const properties = {
      url,
      title: document.title,
      referrer: document.referrer,
      path: pathname,
      search: window.location.search,
      hash: window.location.hash,
      source,
      ...common_properties,
    };

    if (showLog) {
      console.info(`RudderStack Page View (${source}):`, properties);
    }

    this.analyticsInstance.page(properties);
  };

  private attachTrackingToElements = (elements: NodeListOf<Element>) => {
    elements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      if (!this.trackedElements.has(htmlElement)) {
        htmlElement.addEventListener("click", this.trackingEvent);
        this.trackedElements.add(htmlElement);
        if (showLog) {
          console.log(
            "Attached tracking to element:",
            htmlElement.getAttribute("data-rudderstack-id")
          );
        }
      }
    });
  };

  private setupPageTracking = () => {
    // Track initial page load
    this.trackPageView(window.location.href, "initial_load");

    // Prevent multiple setup of page tracking
    if (RudderStackTracker.isPageTrackingSetup) {
      if (showLog) {
        console.log("Page tracking already setup, skipping...");
      }
      return;
    }

    // Track navigation changes (for SPAs)
    let currentUrl = window.location.href;
    let isTracking = true;

    // Store original methods once
    this.originalPushState = history.pushState.bind(history);
    this.originalReplaceState = history.replaceState.bind(history);

    // Override pushState and replaceState for SPA navigation
    history.pushState = (...args) => {
      this.originalPushState(...args);
      const newUrl = window.location.href;
      if (newUrl !== currentUrl && isTracking) {
        currentUrl = newUrl;
        isTracking = false;
        setTimeout(() => {
          this.trackPageView(newUrl, "pushstate");
          isTracking = true;
        }, 100);
      }
    };

    history.replaceState = (...args) => {
      this.originalReplaceState(...args);
      const newUrl = window.location.href;
      if (newUrl !== currentUrl && isTracking) {
        currentUrl = newUrl;
        isTracking = false;
        setTimeout(() => {
          this.trackPageView(newUrl, "replacestate");
          isTracking = true;
        }, 100);
      }
    };

    // Create and store popstate handler
    this.popstateHandler = () => {
      const newUrl = window.location.href;
      if (newUrl !== currentUrl && isTracking) {
        currentUrl = newUrl;
        isTracking = false;
        setTimeout(() => {
          this.trackPageView(newUrl, "popstate");
          isTracking = true;
        }, 100);
      }
    };

    window.addEventListener("popstate", this.popstateHandler);

    // Mark page tracking as setup
    RudderStackTracker.isPageTrackingSetup = true;

    if (showLog) {
      console.log("Page tracking setup completed");
    }
  };

  private setupObserver = () => {
    // Attach to existing elements first
    const existingElements = document.querySelectorAll("[data-rudderstack-id]");
    this.attachTrackingToElements(existingElements);

    if (showLog) {
      console.log(
        `Found ${existingElements.length} existing elements with data-rudderstack-id attribute.`
      );
    }

    // Setup MutationObserver for dynamic elements
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              if (element.hasAttribute("data-rudderstack-id")) {
                this.attachTrackingToElements(
                  NodeList.prototype.constructor.call(
                    Object.create(NodeList.prototype),
                    element
                  ) as NodeListOf<Element>
                );
              }

              const childElements = element.querySelectorAll(
                "[data-rudderstack-id]"
              );
              if (childElements.length > 0) {
                this.attachTrackingToElements(childElements);
              }
            }
          });
        }

        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-rudderstack-id"
        ) {
          const target = mutation.target as Element;
          if (target.hasAttribute("data-rudderstack-id")) {
            this.attachTrackingToElements(
              NodeList.prototype.constructor.call(
                Object.create(NodeList.prototype),
                target
              ) as NodeListOf<Element>
            );
          }
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-rudderstack-id"],
    });

    if (showLog) {
      console.log("MutationObserver started for dynamic element tracking");
    }
  };

  private trackingEvent = (event: Event) => {
    const element = event.currentTarget as HTMLElement;
    const rudderId = element.getAttribute("data-rudderstack-id");
    const rudderEventName =
      element.getAttribute("data-rudderstack-event") || "Element Clicked";
    const rudderTrackingProps = element.getAttribute("data-rudderstack-props");
    const properties = JSON.parse(rudderTrackingProps || "{}");

    if (showLog) {
      console.info(`RudderStack Tracking Event: ${rudderEventName}`, {
        rudderId,
        ...common_properties,
        ...properties,
      });
    }

    this.analyticsInstance.track(rudderEventName, {
      ...common_properties,
      ...properties,
    });
  };

  public destroy = () => {
    console.log(
      "Destructing RudderStack tracking event listeners and observer"
    );

    // Remove all event listeners
    this.trackedElements.forEach((element) => {
      element.removeEventListener("click", this.trackingEvent);
    });
    this.trackedElements.clear();

    // Disconnect observer
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }

    // Restore original history methods
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
    }

    // Remove popstate listener
    if (this.popstateHandler) {
      window.removeEventListener("popstate", this.popstateHandler);
      this.popstateHandler = null;
    }

    this.isInitialized = false;
    RudderStackTracker.instance = null;
    RudderStackTracker.isPageTrackingSetup = false;

    if (showLog) {
      console.log("All tracking cleanup completed");
    }
  };
}

// Legacy function wrapper for backward compatibility
export const rudderstackTracking = async () => {
  const tracker = RudderStackTracker.getInstance();
  const success = await tracker.initialize();

  if (success) {
    return { destructRudderstackTracking: tracker.destroy };
  }
  return null;
};

export default rudderstackTracking;
export { RudderStackTracker };