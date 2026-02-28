import ProfileGate from "@/components/ProfileGate";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Profile = () => {
  useLayoutConfig({
    seo: { titleKey: "seo.profile.title", descriptionKey: "seo.profile.desc", path: "/profile" },
    disableContentWrapper: false,
      contentClassName: "container mx-auto flex max-w-3xl flex-col px-4 py-4 md:py-6",
  });

  return (
    <ProfileGate mode="edit" />
  );
};

export default Profile;
