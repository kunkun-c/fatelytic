import * as React from "react";

import { AnimateIcon } from "@/components/animate-ui/icons/icon";

import {
  Activity as ActivityIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Check as CheckIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  Clock as ClockIcon,
  Compass as CompassIcon,
  Download as DownloadIcon,
  Heart as HeartIcon,
  Layers as LayersIcon,
  Lock as LockIcon,
  MapPin as MapPinIcon,
  MessageCircle as MessageCircleIcon,
  PanelLeft as PanelLeftIcon,
  Search as SearchIcon,
  Sparkles as SparklesIcon,
  Star as StarIcon,
  Trash2 as Trash2Icon,
  Upload as UploadIcon,
  User as UserIcon,
  X as XIcon,
} from "@/components/animate-ui/icons/index";

type AnimateUiIconLikeProps = {
  animate?: boolean | string;
  animateOnHover?: boolean | string;
  animateOnTap?: boolean | string;
  animateOnView?: boolean | string;
  animation?: string;
  loop?: boolean;
  loopDelay?: number;
  delay?: number;
  persistOnAnimateEnd?: boolean;
  initialOnAnimateEnd?: boolean;
  completeOnStop?: boolean;
};

function withDefaultIconAnimation<P extends object>(
  Icon: React.ComponentType<P>,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<unknown>> {
  const Wrapped = React.forwardRef<unknown, P>((props, ref) => {
    const p = props as P & AnimateUiIconLikeProps;
    const hasTrigger =
      p.animate !== undefined ||
      p.animateOnHover !== undefined ||
      p.animateOnTap !== undefined ||
      p.animateOnView !== undefined;

    const nextProps = (hasTrigger
      ? { ...p }
      : {
          ...p,
          animateOnHover: true,
        }) as P;

    return React.createElement(Icon as React.ComponentType<P>, {
      ...(nextProps as P),
      ref,
    });
  });

  Wrapped.displayName = `Animated(${Icon.displayName ?? Icon.name ?? "Icon"})`;

  return Wrapped;
}

function withDefaultLucideIconAnimation<P extends object>(
  Icon: React.ComponentType<P>,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P & AnimateUiIconLikeProps> & React.RefAttributes<unknown>> {
  const Wrapped = React.forwardRef<unknown, P & AnimateUiIconLikeProps>((props, ref) => {
    const {
      animate,
      animateOnHover,
      animateOnTap,
      animateOnView,
      animation,
      loop,
      loopDelay,
      delay,
      persistOnAnimateEnd,
      initialOnAnimateEnd,
      completeOnStop,
      ...rest
    } = props;

    const hasTrigger =
      animate !== undefined ||
      animateOnHover !== undefined ||
      animateOnTap !== undefined ||
      animateOnView !== undefined;

    const child = React.createElement(Icon as React.ComponentType<P>, {
      ...(rest as P),
      ref,
    });

    return React.createElement(AnimateIcon as unknown as React.ComponentType<unknown>, {
      animate,
      animateOnHover: hasTrigger ? animateOnHover : (animateOnHover ?? true),
      animateOnTap,
      animateOnView,
      animation,
      loop,
      loopDelay,
      delay,
      persistOnAnimateEnd,
      initialOnAnimateEnd,
      completeOnStop,
      asChild: true,
      children: child,
    } as unknown);
  });

  Wrapped.displayName = `Animated(${Icon.displayName ?? Icon.name ?? "Icon"})`;

  return Wrapped;
}

const Activity = withDefaultIconAnimation(ActivityIcon);
const ArrowLeft = withDefaultIconAnimation(ArrowLeftIcon);
const ArrowRight = withDefaultIconAnimation(ArrowRightIcon);
const Check = withDefaultIconAnimation(CheckIcon);
const ChevronDown = withDefaultIconAnimation(ChevronDownIcon);
const ChevronLeft = withDefaultIconAnimation(ChevronLeftIcon);
const ChevronRight = withDefaultIconAnimation(ChevronRightIcon);
const ChevronUp = withDefaultIconAnimation(ChevronUpIcon);
const Clock = withDefaultIconAnimation(ClockIcon);
const Compass = withDefaultIconAnimation(CompassIcon);
const Download = withDefaultIconAnimation(DownloadIcon);
const Heart = withDefaultIconAnimation(HeartIcon);
const Layers = withDefaultIconAnimation(LayersIcon);
const Lock = withDefaultIconAnimation(LockIcon);
const MapPin = withDefaultIconAnimation(MapPinIcon);
const MessageCircle = withDefaultIconAnimation(MessageCircleIcon);
const PanelLeft = withDefaultIconAnimation(PanelLeftIcon);
const Search = withDefaultIconAnimation(SearchIcon);
const Sparkles = withDefaultIconAnimation(SparklesIcon);
const Star = withDefaultIconAnimation(StarIcon);
const Trash2 = withDefaultIconAnimation(Trash2Icon);
const Upload = withDefaultIconAnimation(UploadIcon);
const User = withDefaultIconAnimation(UserIcon);
const X = withDefaultIconAnimation(XIcon);

export {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Download,
  Heart,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  PanelLeft,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  User,
  X,
};

import {
  BarChart3 as BarChart3Icon,
  BookOpen as BookOpenIcon,
  Brain as BrainIcon,
  Briefcase as BriefcaseIcon,
  Calendar as CalendarIcon,
  Circle as CircleIcon,
  Dot as DotIcon,
  FileImage as FileImageIcon,
  Globe as GlobeIcon,
  GripVertical as GripVerticalIcon,
  Hash as HashIcon,
  Image as ImageIcon,
  ImagePlus as ImagePlusIcon,
  Info as InfoIcon,
  Loader2 as Loader2Icon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  MoreHorizontal as MoreHorizontalIcon,
  Send as SendIcon,
  Shield as ShieldIcon,
  Wallet as WalletIcon,
} from "lucide-react";

const BarChart3 = withDefaultLucideIconAnimation(BarChart3Icon);
const BookOpen = withDefaultLucideIconAnimation(BookOpenIcon);
const Brain = withDefaultLucideIconAnimation(BrainIcon);
const Briefcase = withDefaultLucideIconAnimation(BriefcaseIcon);
const Calendar = withDefaultLucideIconAnimation(CalendarIcon);
const Circle = withDefaultLucideIconAnimation(CircleIcon);
const Dot = withDefaultLucideIconAnimation(DotIcon);
const FileImage = withDefaultLucideIconAnimation(FileImageIcon);
const Globe = withDefaultLucideIconAnimation(GlobeIcon);
const GripVertical = withDefaultLucideIconAnimation(GripVerticalIcon);
const Hash = withDefaultLucideIconAnimation(HashIcon);
const Image = withDefaultLucideIconAnimation(ImageIcon);
const ImagePlus = withDefaultLucideIconAnimation(ImagePlusIcon);
const Info = withDefaultLucideIconAnimation(InfoIcon);
const Loader2 = withDefaultLucideIconAnimation(Loader2Icon);
const LogOut = withDefaultLucideIconAnimation(LogOutIcon);
const Menu = withDefaultLucideIconAnimation(MenuIcon);
const MoreHorizontal = withDefaultLucideIconAnimation(MoreHorizontalIcon);
const Send = withDefaultLucideIconAnimation(SendIcon);
const Shield = withDefaultLucideIconAnimation(ShieldIcon);
const Wallet = withDefaultLucideIconAnimation(WalletIcon);

export {
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Circle,
  Dot,
  FileImage,
  Globe,
  GripVertical,
  Hash,
  Image,
  ImagePlus,
  Info,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Send,
  Shield,
  Wallet,
};
