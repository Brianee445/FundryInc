import { Container } from '@/app/components/ui/Container';
import { LinkPreviewCard } from '@/app/components/ui/LinkPreviewCard';
import { ArrowRight } from 'lucide-react';

interface SpotlightProfile {
  id: string;
  startup_name: string;
  tagline: string | null;
  description: string | null;
  profile_picture_url: string | null;
  startup_link: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function getSpotlightProfile(): Promise<SpotlightProfile | null> {
  try {
    // revalidate rather than fully static/no-store: the marketing page is
    // prerendered, but an admin flipping the spotlighted founder shouldn't
    // need a redeploy to show up.
    const res = await fetch(`${API_URL}/api/v1/founder-profiles/spotlight/current`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function Spotlight() {
  const profile = await getSpotlightProfile();

  return (
    <section className="py-24">
      <Container>
        <div className="relative overflow-hidden rounded-card border border-borderColor bg-cardBg p-12 md:p-20">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-primaryBlue/20 blur-[80px]" />
          <div className="relative z-10 max-w-2xl">
            <span className="text-sm font-medium uppercase tracking-widest text-primaryBlue">Founder Spotlight</span>

            {profile ? (
              <>
                <div className="mt-2 flex items-center gap-4">
                  {profile.profile_picture_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.startup_name}
                      className="h-14 w-14 shrink-0 rounded-full border border-borderColor object-cover"
                    />
                  )}
                  <h2 className="text-4xl font-bold md:text-5xl">{profile.startup_name}</h2>
                </div>
                <p className="mt-4 text-lg text-secondaryText">
                  {profile.tagline ?? profile.description?.slice(0, 140) ?? 'Building something founders and investors should know about.'}
                </p>
                {profile.startup_link && (
                  <div className="mt-6 max-w-md">
                    <LinkPreviewCard url={profile.startup_link} />
                  </div>
                )}
                {profile.startup_link && (
                  <a
                    href={profile.startup_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-button bg-primaryBlue px-6 py-3 font-medium text-white shadow-card transition-all duration-200 hover:bg-hoverBlue hover:shadow-hover"
                  >
                    Visit {profile.startup_name} <ArrowRight size={18} />
                  </a>
                )}
              </>
            ) : (
              <>
                <h2 className="mt-2 text-4xl font-bold md:text-5xl">Founder stories, coming soon</h2>
                <p className="mt-4 text-lg text-secondaryText">
                  We spotlight one founder at a time — check back soon, or apply once the spotlight program opens up.
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
