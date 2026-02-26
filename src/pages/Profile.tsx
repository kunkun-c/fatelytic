import ProfileGate from "@/components/ProfileGate";
import { useLayoutConfig } from "@/components/layout/use-layout-config";

const Profile = () => {
  useLayoutConfig({
    seo: { titleKey: "seo.profile.title", descriptionKey: "seo.profile.desc", path: "/profile" },
    disableContentWrapper: true,
  });

  return (
    <ProfileGate mode="edit" />
  );
};

export default Profile;
