import type React from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const PageContainer = ({ children, className }: PageContainerProps) => {
  return <div className={cn("container mx-auto px-4 py-10 md:py-16", className)}>{children}</div>;
};

export default PageContainer;
