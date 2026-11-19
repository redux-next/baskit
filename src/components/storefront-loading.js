import ProductCardSkeleton from "./product-card-skeleton";

export default function StorefrontLoading() {
  return (
    <main className="storefront" aria-busy="true" aria-label="Loading DailyCart">
      <div className="announcement">
        <span className="announcement-sparkle">✳</span>
        A little less waiting, a lot more living.
      </div>
      <header className="site-header loading-header">
        <span className="loading-skeleton loading-brand" />
        <span className="loading-skeleton loading-location" />
        <span className="loading-skeleton loading-search" />
      </header>
      <div className="header-rule" />
      <div className="page-shell">
        <section className="storefront-hero-skeleton">
          <div className="storefront-hero-copy-skeleton">
            <span className="loading-skeleton storefront-kicker-skeleton" />
            <span className="loading-skeleton storefront-title-skeleton" />
            <span className="loading-skeleton storefront-text-skeleton" />
            <span className="loading-skeleton storefront-button-skeleton" />
          </div>
          <div className="loading-skeleton storefront-photo-skeleton" />
        </section>
        <section
          className="storefront-loading-products"
          aria-label="Loading products"
        >
          <div className="storefront-loading-heading">
            <span className="loading-skeleton loading-heading-eyebrow" />
            <span className="loading-skeleton loading-heading-title" />
          </div>
          <div className="product-grid">
            {Array.from({ length: 8 }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
