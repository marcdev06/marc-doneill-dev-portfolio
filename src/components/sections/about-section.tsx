import type { HomeContent } from '@/lib/content';

interface AboutSectionProps {
  about: HomeContent['about'];
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="about" className="py-6 py-lg-7" aria-labelledby="about-heading">
      <div className="container">
        <h2 className="mb-5 pf-reveal" id="about-heading">
          {about.heading}
        </h2>
        <div className="row gy-4 align-items-start">
          <div className="col-lg-7 pf-reveal">
            <p className="lead mb-0">{about.paragraph}</p>
          </div>
          <div className="col-lg-5 pf-reveal">
            <aside className="card pf-lift" aria-labelledby="how-i-work-heading">
              <div className="card-body">
                <h3 className="card-title fw-semibold pf-eyebrow" id="how-i-work-heading">
                  {about.howIWork.heading}
                </h3>
                <p className="mb-0">{about.howIWork.text}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
