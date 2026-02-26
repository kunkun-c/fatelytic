import { Helmet } from "react-helmet-async";
import { useI18n } from "@/lib/i18n";

interface SEOHeadProps {
  titleKey: string;
  descriptionKey: string;
  path?: string;
}

export default function SEOHead({ titleKey, descriptionKey, path = "" }: SEOHeadProps) {
  const { t } = useI18n();
  const title = t(titleKey);
  const description = t(descriptionKey);
  const baseUrl = window.location.origin;
  const url = `${baseUrl}${path}`;

  return (
    <Helmet>
      <html lang="vi" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="vi_VN" />
      <meta property="og:site_name" content="Fatelytic" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
