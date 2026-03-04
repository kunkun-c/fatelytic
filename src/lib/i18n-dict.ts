import { APP_STORAGE_PREFIX } from "@/lib/brand";

export type Lang = "vi" | "en";

export type TranslationDict = Record<string, Record<Lang, string>>;

export const STORAGE_KEY = `${APP_STORAGE_PREFIX}:lang`;

export const DEFAULT_LANG: Lang = "vi";
export const FALLBACK_LANG: Lang = "vi";

export type InterpolationValues = Record<string, string | number | boolean | null | undefined>;

export function interpolate(template: string, values?: InterpolationValues) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const raw = values[key];
    if (raw === null || raw === undefined) return "";
    return String(raw);
  });
}

export const translations = {
  // Common
  "app.name": { vi: "Fatelytic", en: "Fatelytic" },
  "app.tagline": { vi: "Khám Phá Bản Thân Qua Tâm Lý Học & Con Số", en: "Self-Discovery Through Psychology & Numbers" },
  "common.comingSoon": { vi: "Sắp ra mắt", en: "Coming soon" },
  "lang.vi": { vi: "Tiếng Việt", en: "Vietnamese" },
  "lang.en": { vi: "Tiếng Anh", en: "English" },

  // Nav
  "nav.dashboard": { vi: "Bảng Điều Khiển", en: "Dashboard" },
  "nav.numerology": { vi: "Thần Số Học", en: "Numerology" },
  "nav.moreTools": { vi: "Công Cụ Khác", en: "More Tools" },
  "nav.easternAstrology": { vi: "Tử Vi Phương Đông", en: "Eastern Astrology" },
  "nav.westernAstrology": { vi: "Chiêm Tinh Phương Tây", en: "Western Astrology" },
  "nav.tarot": { vi: "Tarot", en: "Tarot" },
  "nav.iching": { vi: "Kinh Dịch", en: "I Ching" },
  "nav.careerAi": { vi: "Tư Vấn Nghề Nghiệp", en: "Career" },
  "nav.history": { vi: "Lịch Sử", en: "History" },
  "nav.signIn": { vi: "Đăng Nhập", en: "Sign In" },
  "nav.signOut": { vi: "Đăng Xuất", en: "Sign Out" },
  "nav.freeReading": { vi: "Xem Miễn Phí", en: "Free Reading" },
  "nav.overview": { vi: "Tổng Quan", en: "Overview" },
  "nav.explore": { vi: "Khám Phá", en: "Explore" },
  "nav.consultation": { vi: "Tư Vấn", en: "Consultation" },
  "auth.completing": { vi: "Đang hoàn tất đăng nhập...", en: "Completing sign in..." },

  // Landing
  "landing.hero.title": { vi: "Khám Phá Bản Thân Qua Con Số & Phân Tích Tâm Lý Học", en: "Discover Yourself Through Numbers and Psychology-Based Insights" },
  "landing.hero.subtitle": {
  "vi": "Một nền tảng tự khám phá bản thân hiện đại, kết hợp trí tuệ cổ điển với phân tích tâm lý để giúp bạn hiểu mình rõ hơn và lựa chọn con đường phù hợp.",
  "en": "A modern self-discovery platform combining ancient wisdom with psychological analysis to help you understand yourself and choose your path with clarity."
},
 "landing.hero.cta": {
  "vi": "Bắt đầu khám phá",
  "en": "Start Your Journey"
},
  "landing.hero.explore": { vi: "Khám Phá Tất Cả Công Cụ", en: "Explore All Tools" },
  "landing.howItWorks": {
  "vi": "Cách nền tảng hoạt động",
  "en": "How It Works"
},
"landing.howItWorksDesc": {
  "vi": "Dựa trên tâm lý học hiện đại, kết hợp các hệ thống biểu tượng để tạo nên góc nhìn sâu sắc về bản thân.",
  "en": "Grounded in modern psychology and enriched by symbolic systems for deeper self-understanding."
},
"landing.feature1.title": {
  "vi": "Phân tích cá nhân hóa",
  "en": "Personalized Insights"
},
"landing.feature1.desc": {
  "vi": "Mỗi phân tích được xây dựng riêng cho bạn, phản ánh tính cách, xu hướng và điểm mạnh nội tại.",
  "en": "Each interpretation is tailored to reflect your personality traits, tendencies, and inner strengths."
},

"landing.feature2.title": {
  "vi": "Định hướng nghề nghiệp",
  "en": "Career Orientation"
},
"landing.feature2.desc": {
  "vi": "Hiểu rõ khả năng tự nhiên của bạn để lựa chọn hướng đi nghề nghiệp phù hợp và bền vững.",
  "en": "Understand your natural abilities to choose a career path that fits and endures."
},

"landing.feature3.title": {
  "vi": "Góc nhìn đời sống",
  "en": "Life Reflections"
},
"landing.feature3.desc": {
  "vi": "Những gợi ý giúp bạn nhìn lại các mối quan hệ, quyết định và hành trình phát triển bản thân.",
  "en": "Thoughtful reflections for relationships, decisions, and personal growth."
},

"landing.feature4.title": {
  "vi": "Riêng tư tuyệt đối",
  "en": "Privacy First"
},
"landing.feature4.desc": {
  "vi": "Thông tin của bạn được bảo vệ và chỉ phục vụ cho quá trình tự khám phá.",
  "en": "Your information is protected and used only for your self-discovery journey."
},
"landing.disclaimer": {
  "vi": "Nền tảng này được thiết kế như một công cụ tự chiêm nghiệm và hiểu bản thân, không nhằm dự đoán hay định đoạt tương lai.",
  "en": "This platform is designed for self-reflection and understanding, not for predicting or determining destiny."
},

  // Calculator
  "calc.title": { vi: "Xem Thần Số Học", en: "Numerology Reading" },
  "calc.subtitle": { vi: "Nhập thông tin của bạn để nhận phân tích tâm lý học cá nhân.", en: "Enter your details for a personalized psychology-based analysis." },
  "calc.readySubtitle": { vi: "Sẵn sàng phân tích thần số học của bạn", en: "Ready to analyze your numerology" },
  "calc.savedToHistory": { vi: "Đã lưu kết quả vào lịch sử", en: "Reading saved to history" },
  "calc.editInfo": { vi: "Chỉnh sửa thông tin", en: "Edit information" },
  "calc.fullName": { vi: "Họ và Tên", en: "Full Name" },
  "calc.fullNamePlaceholder": { vi: "Nhập họ và tên đầy đủ", en: "Enter your full name" },
  "calc.dob": { vi: "Ngày Sinh", en: "Date of Birth" },
  "calc.day": { vi: "Ngày", en: "Day" },
  "calc.month": { vi: "Tháng", en: "Month" },
  "calc.year": { vi: "Năm", en: "Year" },
  "calc.gender": { vi: "Giới Tính (tùy chọn)", en: "Gender (optional)" },
  "calc.selectGender": { vi: "Chọn giới tính", en: "Select gender" },
  "calc.male": { vi: "Nam", en: "Male" },
  "calc.female": { vi: "Nữ", en: "Female" },
  "calc.other": { vi: "Khác", en: "Other" },
  "calc.preferNot": { vi: "Không muốn nói", en: "Prefer not to say" },
  "calc.timeOfBirth": { vi: "Giờ Sinh (sắp có)", en: "Time of Birth (coming soon)" },
  "calc.location": { vi: "Quốc Gia / Thành Phố (sắp có)", en: "Country / City (coming soon)" },
  "calc.comingSoon": { vi: "Sẽ có trong bản cập nhật tiếp theo", en: "Available in future update" },
  "calc.generate": { vi: "Xem Kết Quả Của Tôi", en: "Generate My Reading" },
  "calc.generating": { vi: "Đang Phân Tích...", en: "Generating Your Reading..." },
  "calc.privacy": { vi: "Dữ liệu của bạn được bảo mật và không bao giờ chia sẻ với bên thứ ba.", en: "Your data is private and never shared with third parties." },
  "calc.nameError": { vi: "Vui lòng nhập họ và tên.", en: "Please enter your full name." },
  "calc.dobError": { vi: "Vui lòng chọn ngày sinh.", en: "Please select your date of birth." },

  // Result
  "result.readingFor": { vi: "Kết quả cho", en: "Reading for" },
  "result.title": { vi: "Hồ Sơ Thần Số Học", en: "Your Numerology Profile" },
  "result.subtitle": { vi: "Phân tích dựa trên tâm lý học về các con số của bạn.", en: "A psychology-based interpretation of your numbers." },
  "result.lifePath": { vi: "Số Chủ Đạo", en: "Life Path" },
  "result.expression": { vi: "Số Biểu Đạt", en: "Expression" },
  "result.soulUrge": { vi: "Số Linh Hồn", en: "Soul Urge" },
  "result.lifePathOverview": { vi: "Tổng Quan Số Chủ Đạo", en: "Life Path Overview" },
  "result.strengths": { vi: "Điểm Mạnh", en: "Your Strengths" },
  "result.growthAreas": { vi: "Lĩnh Vực Phát Triển", en: "Growth Areas" },
  "result.career": { vi: "Gợi Ý Nghề Nghiệp", en: "Career Suggestions" },
  "result.relationship": { vi: "Phong Cách Quan Hệ", en: "Relationship Style" },
  "result.askAi": { vi: "Hỏi AI Để Hiểu Sâu Hơn", en: "Ask AI for Deeper Explanation" },
  "result.downloadPdf": { vi: "Tải PDF", en: "Download PDF" },
  "result.dailyInsights": { vi: "Phân Tích Hàng Ngày", en: "Daily Insights" },
  "result.disclaimer": { vi: "Nội dung này chỉ nhằm mục đích tự hiểu bản thân và suy ngẫm.", en: "This content is for self-understanding and reflection purposes only." },
  "result.signInToSave": { vi: "Đăng nhập để lưu kết quả này vào lịch sử của bạn", en: "Sign in to save this reading to your history" },
  "result.signIn": { vi: "Đăng nhập", en: "Sign In" },

  // Chat
// Chat
"chat.title": {
  "vi": "Đối thoại & Chiêm nghiệm",
  "en": "Dialogue & Reflection"
},
"chat.subtitle": {
  "vi": "Người bạn đồng hành trong hành trình hiểu mình.",
  "en": "Your companion on the path of self-understanding."
},
"chat.placeholder": {
  "vi": "Hỏi về nghề nghiệp, thế mạnh, cảm xúc, định hướng cuộc sống...",
  "en": "Ask about career, strengths, emotions, or life direction..."
},
"chat.welcome": {
  "vi": "Chào bạn! Tôi ở đây để cùng bạn nhìn lại bản thân qua góc nhìn tâm lý và phát triển cá nhân. Bạn có thể chọn một chủ đề hoặc đặt câu hỏi bất kỳ.",
  "en": "Hello! I'm here to help you reflect on yourself through psychological and personal development perspectives. Choose a topic or ask anything."
},
"chat.typing.reply": {
  "vi": "Đang phản hồi",
  "en": "Responding"
},
"chat.typing.thinking": {
  "vi": "Đang suy ngẫm",
  "en": "Reflecting"
},
"chat.errorFallback": {
  "vi": "Xin lỗi, hệ thống đang tạm gián đoạn. Bạn có thể quay lại sau ít phút.",
  "en": "Sorry, the system is temporarily unavailable. Please try again shortly."
},
"chat.error": {
  "vi": "Đã xảy ra lỗi. Vui lòng thử lại.",
  "en": "An error occurred. Please try again."
},
"chat.micPermission": {
  "vi": "Vui lòng cho phép truy cập micro để sử dụng tính năng ghi âm.",
  "en": "Please allow microphone access to use the recording feature."
},
"chat.micNotFound": {
  "vi": "Không tìm thấy thiết bị micro. Vui lòng kiểm tra kết nối.",
  "en": "No microphone device found. Please check your connection."
},
"chat.noAudio": {
  "vi": "Không ghi được âm thanh. Vui lòng thử lại.",
  "en": "No audio recorded. Please try again."
},
"chat.quickAction.explain": {
  "vi": "Hiểu rõ hồ sơ của tôi",
  "en": "Understand my profile"
},
"chat.quickAction.career": {
  "vi": "Định hướng nghề nghiệp",
  "en": "Career orientation"
},
"chat.quickAction.growth": {
  "vi": "Phát triển bản thân",
  "en": "Personal development"
},
"chat.quickAction.summary": {
  "vi": "Tổng hợp & chiêm nghiệm",
  "en": "Overall reflection"
},
"chat.quickPrompt.explain": {
  "vi": "Hãy giúp tôi hiểu rõ hơn hồ sơ thần số học của mình.",
  "en": "Help me better understand my numerology profile."
},
"chat.quickPrompt.career": {
  "vi": "Dựa trên hồ sơ của tôi, hãy gợi ý những hướng nghề nghiệp phù hợp.",
  "en": "Based on my profile, suggest suitable career paths."
},
"chat.quickPrompt.growth": {
  "vi": "Tôi muốn được tư vấn về điểm mạnh và hướng phát triển bản thân.",
  "en": "Advise me on my strengths and personal growth."
},
"chat.quickPrompt.summary": {
  "vi": "Hãy giúp tôi nhìn tổng thể về tính cách và tiềm năng của mình.",
  "en": "Provide an overall view of my personality and potential."
},

  // Dashboard
  "dashboard.title": { vi: "Khám Phá", en: "Discover" },
"dashboard.subtitle": {
  "vi": "Những công cụ giúp bạn soi chiếu bản thân qua lăng kính tâm lý học và tri thức cổ điển.",
  "en": "Tools that help you reflect on yourself through psychology and timeless wisdom."
},
"dashboard.comingSoon": {
  "vi": "Nhiều công cụ mới sẽ sớm xuất hiện. Mỗi module là một không gian để bạn chiêm nghiệm và hiểu mình sâu hơn.",
  "en": "More tools are coming soon. Each module is designed as a space for reflection and deeper self-understanding."
},
"dashboard.numerology.desc": {
  "vi": "Khám phá Số Chủ Đạo và những khuynh hướng tính cách ảnh hưởng đến con đường nghề nghiệp của bạn.",
  "en": "Explore your Life Path and personality patterns that shape your career direction."
},
"dashboard.eastern.desc": {
  "vi": "Tử Vi và Bát Tự dưới góc nhìn tâm lý, giúp bạn hiểu cấu trúc nội tâm và chu kỳ cuộc sống.",
  "en": "Tu Vi and Bazi interpreted psychologically to understand your inner structure and life cycles."
},
"dashboard.western.desc": {
  "vi": "Bản đồ sao như một tấm gương phản chiếu cảm xúc, động lực và tiềm năng phát triển.",
  "en": "Your birth chart as a mirror of emotions, motivations, and growth potential."
},
"dashboard.tarot.desc": {
  "vi": "Những lá bài gợi mở suy ngẫm, hỗ trợ bạn nhìn rõ hơn các lựa chọn trước mắt.",
  "en": "Cards that invite reflection and bring clarity to your current choices."
},
"dashboard.iching.desc": {
  "vi": "Trí tuệ Kinh Dịch được diễn giải như một công cụ quan sát biến chuyển tâm lý.",
  "en": "I Ching wisdom reframed as a tool to observe psychological change."
},
"dashboard.career.desc": {
  "vi": "Gợi mở con đường nghề nghiệp phù hợp với bản đồ tự khám phá của riêng bạn.",
  "en": "Reveal career directions aligned with your unique self-discovery profile."
},

  // Profile
"profile.tagline": {
  "vi": "Hồ sơ cá nhân",
  "en": "Personal Profile"
},
"profile.title": {
  "vi": "Xây Dựng Hồ Sơ Của Bạn",
  "en": "Build Your Personal Profile"
},
"profile.subtitle": {
  "vi": "Thông tin này giúp các công cụ phân tích sâu và phù hợp hơn với hành trình của bạn.",
  "en": "This information helps personalize and deepen your experience across all tools."
},
"profile.fullName": {
  "vi": "Họ và tên",
  "en": "Full name"
},
"profile.fullNamePlaceholder": {
  "vi": "Nhập đầy đủ họ và tên của bạn",
  "en": "Enter your full name"
},
"profile.dob": {
  "vi": "Ngày sinh (Dương lịch)",
  "en": "Date of birth (solar calendar)"
},
"profile.timeOfBirth": {
  "vi": "Giờ sinh (không bắt buộc)",
  "en": "Time of birth (optional)"
},
"profile.gender": {
  "vi": "Giới tính",
  "en": "Gender"
},
"profile.genderPlaceholder": {
  "vi": "Chọn giới tính",
  "en": "Select gender"
},
"profile.placeOfBirth": {
  "vi": "Nơi sinh",
  "en": "Place of birth"
},
"profile.placePlaceholder": {
  "vi": "Tỉnh/Thành, Quận/Huyện, Phường/Xã",
  "en": "Province, District, Ward"
},
"profile.province": {
  "vi": "Tỉnh / Thành phố",
  "en": "Province"
},
"profile.district": {
  "vi": "Quận / Huyện",
  "en": "District"
},
"profile.ward": {
  "vi": "Phường / Xã",
  "en": "Ward"
},
"profile.provincePlaceholder": {
  "vi": "Chọn Tỉnh / Thành phố",
  "en": "Select province"
},
"profile.districtPlaceholder": {
  "vi": "Chọn Quận / Huyện",
  "en": "Select district"
},
"profile.wardPlaceholder": {
  "vi": "Chọn Phường / Xã",
  "en": "Select ward"
},
"profile.locationLoading": {
  "vi": "Đang tải dữ liệu địa lý...",
  "en": "Loading location data..."
},
"profile.timeNote": {
  "vi": "Nếu có giờ sinh, hệ thống sẽ phân tích chi tiết và chính xác hơn.",
  "en": "Including your time of birth allows for more refined insights."
},
"profile.save": {
  "vi": "Lưu hồ sơ",
  "en": "Save profile"
},
"profile.saving": {
  "vi": "Đang lưu thông tin...",
  "en": "Saving your profile..."
},
"profile.fullNameError": {
  "vi": "Vui lòng nhập đầy đủ họ và tên.",
  "en": "Please enter your full name."
},
"profile.dobError": {
  "vi": "Vui lòng chọn ngày sinh.",
  "en": "Please select your date of birth."
},
"profile.placeError": {
  "vi": "Vui lòng nhập nơi sinh.",
  "en": "Please enter your place of birth."
},

  // Module pages
"module.numerology.title": {
  "vi": "Thần Số Học",
  "en": "Numerology"
},
"module.numerology.desc": {
  "vi": "Những con số phản ánh khuynh hướng tính cách và định hướng phát triển cá nhân.",
  "en": "Numbers that reflect personality patterns and personal growth directions."
},

"module.eastern.title": {
  "vi": "Tử Vi Phương Đông",
  "en": "Eastern Astrology"
},
"module.eastern.desc": {
  "vi": "Khám phá cấu trúc nội tâm và chu kỳ cuộc sống qua Tử Vi và Bát Tự.",
  "en": "Explore inner structure and life cycles through Tu Vi and Bazi."
},

"module.western.title": {
  "vi": "Chiêm Tinh Phương Tây",
  "en": "Western Astrology"
},
"module.western.desc": {
  "vi": "Bản đồ sao như ngôn ngữ của cảm xúc và động lực bên trong bạn.",
  "en": "Your birth chart as a language of emotions and inner drives."
},

"module.tarot.title": {
  "vi": "Tarot",
  "en": "Tarot"
},
"module.tarot.desc": {
  "vi": "Những hình ảnh biểu tượng giúp bạn suy ngẫm và ra quyết định sáng suốt hơn.",
  "en": "Symbolic images that support reflection and clearer decision-making."
},

"module.iching.title": {
  "vi": "Kinh Dịch",
  "en": "I Ching"
},
"module.iching.desc": {
  "vi": "Trí tuệ cổ đại soi sáng những chuyển động tâm lý hiện tại.",
  "en": "Ancient wisdom illuminating present psychological shifts."
},

"module.career.title": {
  "vi": "Tư Vấn Nghề Nghiệp AI",
  "en": "AI Career Guidance"
},
"module.career.desc": {
  "vi": "Đối thoại cùng AI để hiểu rõ hơn con đường nghề nghiệp phù hợp với bạn.",
  "en": "Dialogue with AI to clarify career paths aligned with who you are."
},

"module.start": {
  "vi": "Bắt đầu hành trình",
  "en": "Begin your journey"
},
"module.promptPlaceholder": {
  "vi": "Nhập câu hỏi hoặc chủ đề bạn muốn chiêm nghiệm...",
  "en": "Enter a question or topic you wish to reflect on..."
},

  // Login
  "login.welcome": { vi: "Chào Mừng Trở Lại", en: "Welcome Back" },
  "login.createAccount": { vi: "Tạo Tài Khoản", en: "Create Account" },
  "login.startJourney": { vi: "Bắt đầu hành trình khám phá bản thân.", en: "Start your self-discovery journey." },
  "login.continueJourney": { vi: "Tiếp tục hành trình của bạn.", en: "Continue your journey." },
  "login.name": { vi: "Họ và Tên", en: "Full Name" },
  "login.namePlaceholder": { vi: "Tên của bạn", en: "Your name" },
  "login.email": { vi: "Email", en: "Email" },
  "login.password": { vi: "Mật Khẩu", en: "Password" },
  "login.enterPassword": { vi: "Nhập mật khẩu", en: "Enter password" },
  "login.signInBtn": { vi: "Đăng Nhập", en: "Sign In" },
  "login.signUpBtn": { vi: "Tạo Tài Khoản", en: "Create Account" },
  "login.alreadyHave": { vi: "Đã có tài khoản?", en: "Already have an account?" },
  "login.dontHave": { vi: "Chưa có tài khoản?", en: "Don't have an account?" },
  "login.backHome": { vi: "Về trang chủ", en: "Back to home" },
  "login.orContinue": { vi: "Hoặc tiếp tục với", en: "Or continue with" },
  "login.google": { vi: "Đăng nhập bằng Google", en: "Sign in with Google" },
  "login.loading": { vi: "Đang xử lý...", en: "Processing..." },
  "login.toast.googleError": { vi: "Đăng nhập Google thất bại. Vui lòng thử lại.", en: "Google sign-in failed. Please try again." },
  "login.toast.signUpSuccess": { vi: "Tạo tài khoản thành công!", en: "Account created successfully!" },
  "login.toast.signInSuccess": { vi: "Đăng nhập thành công!", en: "Signed in successfully!" },
  "login.toast.authError": { vi: "Không thể xác thực. Vui lòng thử lại.", en: "Authentication failed. Please try again." },
  "login.toast.emailConfirmation": { vi: "Vui lòng kiểm tra email để xác thực tài khoản.", en: "Please check your email to confirm your account." },
  "login.validation.emailRequired": { vi: "Vui lòng nhập email.", en: "Please enter your email." },
  "login.validation.emailInvalid": { vi: "Email không hợp lệ.", en: "Invalid email address." },
  "login.validation.passwordRequired": { vi: "Vui lòng nhập mật khẩu.", en: "Please enter your password." },
  "login.validation.passwordMin": { vi: "Mật khẩu cần ít nhất 6 ký tự.", en: "Password must be at least 6 characters." },
  "login.validation.nameRequired": { vi: "Vui lòng nhập họ và tên.", en: "Please enter your full name." },
  "login.error.invalidCredentials": { vi: "Thông tin đăng nhập không đúng hoặc tài khoản chưa tồn tại.", en: "Incorrect credentials or account does not exist." },
  "login.error.userAlreadyExists": { vi: "Email này đã có tài khoản. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.", en: "This email is already registered. Please sign in or use password reset." },
  "login.error.passwordWeak": { vi: "Mật khẩu không hợp lệ. Vui lòng dùng mật khẩu mạnh hơn.", en: "Password is not valid. Please use a stronger password." },

  // History
"history.title": {
  "vi": "Hành Trình Đã Lưu",
  "en": "Your Journey History"
},
"history.subtitle": {
  "vi": "Nhìn lại những lần bạn đã soi chiếu và hiểu mình sâu hơn.",
  "en": "Review your past reflections and insights."
},
"history.empty": {
  "vi": "Chưa có phân tích nào",
  "en": "No reflections yet"
},
"history.emptyDesc": {
  "vi": "Hãy bắt đầu một lần khám phá để lưu lại hành trình của bạn tại đây.",
  "en": "Start your first reflection to build your personal history."
},
"history.startReading": {
  "vi": "Bắt đầu khám phá",
  "en": "Start exploring"
},
"history.view": {
  "vi": "Xem lại",
  "en": "View"
},
"history.loadError": {
  "vi": "Không thể tải dữ liệu lịch sử.",
  "en": "Unable to load history."
},
"history.deleteError": {
  "vi": "Không thể xoá kết quả này.",
  "en": "Failed to delete this entry."
},
"history.deleteSuccess": {
  "vi": "Đã xoá khỏi lịch sử của bạn.",
  "en": "Removed from your history."
},
"history.explore": {
  "vi": "Khám phá",
  "en": "Explore"
},
"history.section.eastern": {
  "vi": "Tử Vi Phương Đông",
  "en": "Eastern Astrology"
},
"history.section.easternDesc": {
  "vi": "Khám phá bản thân qua Tử Vi và Bát Tự dưới góc nhìn tâm lý.",
  "en": "Explore yourself through Tu Vi and Bazi with a psychological lens."
},
"history.section.emptyTitle": {
  "vi": "Chưa có dữ liệu",
  "en": "No data yet"
},
"history.section.emptyDesc": {
  "vi": "Hãy hoàn thành một lần luận giải để lưu tại đây.",
  "en": "Complete a reading to save it here."
},
"history.eastern.defaultFileName": {
  "vi": "Lá số của bạn",
  "en": "Your birth chart"
},
"history.eastern.viewSavedImage": {
  "vi": "Xem hình đã lưu",
  "en": "View saved image"
},
"history.section.numerology": {
  "vi": "Thần Số Học",
  "en": "Numerology"
},
"history.section.numerologyDesc": {
  "vi": "Những con số phản ánh khuynh hướng và định hướng cuộc sống.",
  "en": "Numbers reflecting life patterns and direction."
},
"history.section.comingSoon": {
  "vi": "Sắp ra mắt",
  "en": "Coming soon"
},
"history.comingSoon.badge": {
  "vi": "Sắp ra mắt",
  "en": "Coming soon"
},
"history.comingSoon.western.title": {
  "vi": "Chiêm Tinh Phương Tây",
  "en": "Western Astrology"
},
"history.comingSoon.western.desc": {
  "vi": "Bản đồ sao được diễn giải qua góc nhìn tâm lý hiện đại.",
  "en": "Birth chart interpretation through modern psychology."
},
"history.comingSoon.tarot.title": {
  "vi": "Tarot",
  "en": "Tarot"
},
"history.comingSoon.tarot.desc": {
  "vi": "Những hình ảnh biểu tượng giúp bạn suy ngẫm và ra quyết định rõ ràng.",
  "en": "Symbolic imagery for reflection and clearer decisions."
},
"history.comingSoon.iching.title": {
  "vi": "Kinh Dịch",
  "en": "I Ching"
},
"history.comingSoon.iching.desc": {
  "vi": "Trí tuệ cổ đại soi sáng chuyển động nội tâm.",
  "en": "Ancient wisdom illuminating inner change."
},
"history.comingSoon.career.title": {
  "vi": "Tư Vấn Nghề Nghiệp",
  "en": "Career Guidance"
},
"history.comingSoon.career.desc": {
  "vi": "Khám phá con đường nghề nghiệp phù hợp với bạn.",
  "en": "Discover career paths aligned with who you are."
},"history.eastern.option.upload.label": {
  "vi": "Tải lên lá số",
  "en": "Upload chart"
},

  // Topup
  "topup.title": { vi: "Nạp Credit", en: "Top up" },
  "topup.subtitle": {
    vi: "Chọn gói phù hợp. Quét QR bằng app ngân hàng để chuyển khoản đúng nội dung. Credit sẽ tự cộng khi thanh toán thành công.",
    en: "Choose a package. Scan the QR with your banking app and include the correct description. Credits will be added automatically after payment.",
  },
  "topup.modal.title": { vi: "Quét mã QR để thanh toán", en: "Scan QR to pay" },
  "topup.modal.transferHint": {
    vi: "Chuyển {amount} với mã: {code}",
    en: "Transfer {amount} with code: {code}",
  },
  "topup.modal.qrAlt": { vi: "Mã QR thanh toán", en: "Payment QR code" },
  "topup.modal.downloadQr": { vi: "Tải ảnh QR", en: "Download QR" },
  "topup.modal.autoCredit": { vi: "Số credit sẽ được cộng tự động", en: "Credits will be added automatically" },
  "topup.modal.checking": { vi: "Đang chờ thanh toán...", en: "Waiting for payment..." },
  "topup.modal.checkingBtn": { vi: "Đang kiểm tra...", en: "Checking..." },
  "topup.modal.close": { vi: "Đóng", en: "Close" },
  "topup.package.createQr": { vi: "Tạo QR thanh toán", en: "Create payment QR" },
  "topup.package.estimate": { vi: "Ước tính dựa trên giá credit theo tính năng.", en: "Estimates are based on feature credit costs." },
  "topup.history.title": { vi: "Lịch sử nạp tiền", en: "Top-up History" },
  "topup.history.view": { vi: "Xem lịch sử", en: "View History" },
  "topup.history.hide": { vi: "Ẩn lịch sử", en: "Hide History" },
  "topup.history.empty": { vi: "Chưa có lịch sử nạp tiền.", en: "No top-up history yet." },
  "topup.history.viewQr": { vi: "Xem QR", en: "View QR" },
  "topup.status.paid": { vi: "Đã thanh toán", en: "Paid" },
  "topup.status.pending": { vi: "Chờ thanh toán", en: "Pending" },
  "topup.status.expired": { vi: "Hết hạn", en: "Expired" },
  "topup.status.canceled": { vi: "Đã hủy", en: "Canceled" },
  "topup.toast.success": { vi: "Nạp credit thành công!", en: "Top up successful!" },
  "topup.toast.expired": { vi: "Đơn hàng hết hạn.", en: "Order expired." },
  "topup.toast.canceled": { vi: "Đơn hàng đã bị hủy.", en: "Order canceled." },
  "topup.toast.historyFailed": { vi: "Không tải được lịch sử đơn hàng.", en: "Failed to load order history." },
  "topup.toast.downloadFailed": { vi: "Không tải được QR.", en: "Failed to download QR." },
  "topup.toast.sessionExpired": { vi: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", en: "Session expired. Please sign in again." },
  "topup.toast.signInRequired": { vi: "Vui lòng đăng nhập.", en: "Please sign in." },
  "topup.toast.createFailed": { vi: "Không tạo được QR nạp tiền.", en: "Failed to create top up QR." },
  // Insufficient Credits Alert
  "insufficientCredits.title": { vi: "Không đủ credit", en: "Insufficient Credits" },
  "insufficientCredits.description": {
    vi: "Bạn cần {required} credit để thực hiện phân tích, nhưng chỉ có {balance} credit. Hãy nạp thêm để tiếp tục.",
    en: "You need {required} credits for this analysis, but only have {balance} credits. Top up to continue."
  },
  "insufficientCredits.topupButton": { vi: "Nạp credit", en: "Top Up Credits" },
  "insufficientCredits.cancelButton": { vi: "Huỷ", en: "Cancel" },
"history.eastern.option.upload.desc": {
  "vi": "Tải ảnh lá số để được luận giải chi tiết hơn.",
  "en": "Upload your chart image for deeper interpretation."
},
"history.eastern.option.overview.label": {
  "vi": "Tổng quan",
  "en": "Overview"
},
"history.eastern.option.overview.desc": {
  "vi": "Bức tranh tổng thể về cuộc sống và nội tâm của bạn.",
  "en": "A holistic view of your inner life."
},
"history.eastern.option.career.label": {
  "vi": "Sự nghiệp",
  "en": "Career"
},
"history.eastern.option.career.desc": {
  "vi": "Khuynh hướng nghề nghiệp và con đường phát triển.",
  "en": "Career tendencies and growth direction."
},
"history.eastern.option.marriage.label": {
  "vi": "Quan hệ & Tình cảm",
  "en": "Relationships"
},
"history.eastern.option.marriage.desc": {
  "vi": "Những mô thức gắn kết và tình duyên.",
  "en": "Patterns of connection and affection."
},
"history.eastern.option.finance.label": {
  "vi": "Tài chính",
  "en": "Finance"
},
"history.eastern.option.finance.desc": {
  "vi": "Thái độ với tiền bạc và khả năng quản lý tài chính.",
  "en": "Money habits and financial mindset."
},
"history.eastern.option.health.label": {
  "vi": "Sức khoẻ & Nội lực",
  "en": "Wellbeing"
},
"history.eastern.option.health.desc": {
  "vi": "Sự cân bằng giữa thể chất và tinh thần.",
  "en": "Balance of body and mind."
},
"history.eastern.option.fortune.label": {
  "vi": "Chu kỳ cuộc sống",
  "en": "Life cycles"
},
"history.eastern.option.fortune.desc": {
  "vi": "Những giai đoạn cần chú ý và phát triển.",
  "en": "Life phases to focus on."
},
"history.eastern.option.image.label": {
  "vi": "Ảnh minh hoạ",
  "en": "Illustration"
},
"history.eastern.option.image.desc": {
  "vi": "Tạo hình ảnh biểu tượng phong cách Á Đông.",
  "en": "Generate an Eastern-style symbolic illustration."
},

  // ChatPanel
  "chatPanel.qa.explain": { vi: "Giải thích kết quả", en: "Explain result" },
  "chatPanel.qa.strengths": { vi: "Điểm mạnh/yếu", en: "Strengths & weaknesses" },
  "chatPanel.qa.career": { vi: "Sự nghiệp", en: "Career" },
  "chatPanel.qa.love": { vi: "Tình cảm", en: "Relationships" },
  "chatPanel.qp.explain": { vi: "Hãy giải thích chi tiết kết quả của tôi.", en: "Please explain my result in detail." },
  "chatPanel.qp.strengths": { vi: "Hãy chỉ ra điểm mạnh/yếu chính và gợi ý cải thiện.", en: "Highlight strengths/weaknesses and suggest improvements." },
  "chatPanel.qp.career": { vi: "Hãy tư vấn định hướng sự nghiệp phù hợp.", en: "Suggest suitable career directions." },
  "chatPanel.qp.love": { vi: "Hãy phân tích tình cảm/hôn nhân và lời khuyên thực tế.", en: "Analyze relationships and provide practical advice." },

  "chatPanel.module.numerology.qa.explain": { vi: "Giải thích kết quả", en: "Explain result" },
  "chatPanel.module.numerology.qa.strengths": { vi: "Điểm mạnh/yếu", en: "Strengths & weaknesses" },
  "chatPanel.module.numerology.qa.habits": { vi: "Thói quen", en: "Habits" },
  "chatPanel.module.numerology.qa.reflect": { vi: "Câu hỏi gợi mở", en: "Reflection questions" },
  "chatPanel.module.numerology.qp.explain": { vi: "Hãy giải thích chi tiết kết quả thần số học của tôi.", en: "Please explain my numerology result in detail." },
  "chatPanel.module.numerology.qp.strengths": { vi: "Hãy chỉ ra 3 điểm mạnh và 3 điểm cần cải thiện, kèm ví dụ cụ thể.", en: "List 3 strengths and 3 areas to improve with examples." },
  "chatPanel.module.numerology.qp.habits": { vi: "Hãy gợi ý 5 thói quen thực tế để phát huy điểm mạnh và giảm điểm yếu.", en: "Suggest 5 practical habits to grow strengths and reduce weaknesses." },
  "chatPanel.module.numerology.qp.reflect": { vi: "Hãy đặt 5 câu hỏi phản chiếu để tôi tự hiểu mình sâu hơn.", en: "Ask 5 reflection questions to help me understand myself deeper." },

  "chatPanel.module.western.qa.overview": { vi: "Tổng quan", en: "Overview" },
  "chatPanel.module.western.qa.emotion": { vi: "Cảm xúc", en: "Emotions" },
  "chatPanel.module.western.qa.work": { vi: "Công việc", en: "Work" },
  "chatPanel.module.western.qa.blindspots": { vi: "Điểm mù", en: "Blind spots" },
  "chatPanel.module.western.qp.overview": { vi: "Hãy tóm tắt 7-10 ý chính từ góc nhìn chiêm tinh Tây phương (mang tính phản chiếu).", en: "Summarize 7-10 key points from a reflective Western astrology lens." },
  "chatPanel.module.western.qp.emotion": { vi: "Hãy phân tích khuynh hướng cảm xúc và cách tôi tự điều chỉnh khi căng thẳng.", en: "Analyze emotional tendencies and how to self-regulate under stress." },
  "chatPanel.module.western.qp.work": { vi: "Hãy gợi ý hướng nghề nghiệp phù hợp và 1-2 bước thử nghiệm trong 2 tuần.", en: "Suggest suitable career directions and 1-2 experiments for the next 2 weeks." },
  "chatPanel.module.western.qp.blindspots": { vi: "Hãy chỉ ra 2-3 'điểm mù' hành vi và cách khắc phục thực tế.", en: "Point out 2-3 behavioral blind spots and practical ways to improve." },

  "chatPanel.module.tarot.qa.clarify": { vi: "Làm rõ lựa chọn", en: "Clarify options" },
  "chatPanel.module.tarot.qa.emotion": { vi: "Trạng thái cảm xúc", en: "Emotional state" },
  "chatPanel.module.tarot.qa.risk": { vi: "Rủi ro", en: "Risks" },
  "chatPanel.module.tarot.qa.message": { vi: "Thông điệp", en: "Message" },
  "chatPanel.module.tarot.qp.clarify": { vi: "Hãy giúp tôi làm rõ 2-3 lựa chọn hiện tại: ưu/nhược và hành động tiếp theo.", en: "Help me clarify 2-3 current options: pros/cons and the next action." },
  "chatPanel.module.tarot.qp.emotion": { vi: "Hãy phản chiếu trạng thái cảm xúc của tôi và nhu cầu cốt lõi đang bị bỏ quên.", en: "Reflect my emotional state and the core needs I'm neglecting." },
  "chatPanel.module.tarot.qp.risk": { vi: "Hãy nêu rủi ro lớn nhất nếu tôi hành động vội, và cách giảm rủi ro.", en: "Describe the biggest risk if I act too fast, and how to reduce it." },
  "chatPanel.module.tarot.qp.message": { vi: "Hãy tóm tắt thông điệp chính thành 5 gạch đầu dòng + 1 câu hỏi để tôi tự trả lời.", en: "Summarize the main message in 5 bullets + 1 question for me to answer." },

  "chatPanel.module.iching.qa.interpret": { vi: "Diễn giải", en: "Interpretation" },
  "chatPanel.module.iching.qa.actions": { vi: "Hành động", en: "Actions" },
  "chatPanel.module.iching.qa.avoid": { vi: "Điều nên tránh", en: "What to avoid" },
  "chatPanel.module.iching.qa.questions": { vi: "Câu hỏi", en: "Questions" },
  "chatPanel.module.iching.qp.interpret": { vi: "Hãy diễn giải quẻ theo tinh thần Kinh Dịch: bối cảnh, xu hướng, và điều nên giữ.", en: "Interpret the hexagram: context, trend, and what to keep." },
  "chatPanel.module.iching.qp.actions": { vi: "Hãy đề xuất 3 bước hành động nhỏ trong 7 ngày tới phù hợp với thông điệp quẻ.", en: "Suggest 3 small actions for the next 7 days aligned with the message." },
  "chatPanel.module.iching.qp.avoid": { vi: "Hãy nêu 3 điều nên tránh (thiên kiến/hành vi) và dấu hiệu cảnh báo sớm.", en: "List 3 things to avoid (biases/behaviors) and early warning signs." },
  "chatPanel.module.iching.qp.questions": { vi: "Hãy đề xuất 5 câu hỏi phản chiếu để tôi tự kiểm chứng.", en: "Propose 5 reflection questions for self-checking." },

  "chatPanel.module.career.qa.goals": { vi: "Mục tiêu", en: "Goals" },
  "chatPanel.module.career.qa.roadmap": { vi: "Lộ trình", en: "Roadmap" },
  "chatPanel.module.career.qa.cv": { vi: "CV/Portfolio", en: "CV/Portfolio" },
  "chatPanel.module.career.qa.interview": { vi: "Câu hỏi phỏng vấn", en: "Interview questions" },
  "chatPanel.module.career.qp.goals": { vi: "Hãy giúp tôi làm rõ mục tiêu nghề nghiệp 3-6 tháng tới và tiêu chí đo lường.", en: "Help me clarify my 3-6 month career goals and success metrics." },
  "chatPanel.module.career.qp.roadmap": { vi: "Hãy đề xuất lộ trình 4 tuần (theo tuần) với các đầu việc cụ thể.", en: "Propose a 4-week roadmap with concrete tasks each week." },
  "chatPanel.module.career.qp.cv": { vi: "Hãy gợi ý cách cải thiện CV/portfolio theo vai trò tôi đang nhắm tới.", en: "Suggest how to improve my CV/portfolio for the role I'm targeting." },
  "chatPanel.module.career.qp.interview": { vi: "Hãy gợi ý 10 câu hỏi phỏng vấn và cách trả lời theo STAR.", en: "Suggest 10 interview questions and STAR-style answers." },

  "chatPanel.eastern.qa.summary": { vi: "Tóm tắt", en: "Summary" },
  "chatPanel.eastern.qa.strengths": { vi: "Điểm mạnh", en: "Strengths" },
  "chatPanel.eastern.qa.watchouts": { vi: "Điểm cần lưu ý", en: "Watch-outs" },
  "chatPanel.eastern.qa.followups": { vi: "Câu hỏi", en: "Questions" },
  "chatPanel.eastern.qp.overview.summary": { vi: "Hãy tóm tắt 7-10 ý chính từ phần luận giải tổng quan.", en: "Summarize 7-10 key points from the overview." },
  "chatPanel.eastern.qp.overview.strengths": { vi: "Hãy nêu 3 điểm mạnh nổi bật và cách tận dụng trong đời sống.", en: "List 3 key strengths and how to apply them in daily life." },
  "chatPanel.eastern.qp.overview.watchouts": { vi: "Hãy nêu 3 rủi ro/điểm cần lưu ý và cách phòng tránh thực tế.", en: "List 3 risks/watch-outs and practical prevention." },
  "chatPanel.eastern.qp.overview.followups": { vi: "Hãy gợi ý 5 câu hỏi hay để tôi hỏi tiếp cho đúng trọng tâm.", en: "Suggest 5 follow-up questions to ask next." },

  "chatPanel.eastern.career.qa.direction": { vi: "Hướng đi", en: "Direction" },
  "chatPanel.eastern.career.qa.skills": { vi: "Nâng kỹ năng", en: "Skills" },
  "chatPanel.eastern.career.qa.decisions": { vi: "Ra quyết định", en: "Decision-making" },
  "chatPanel.eastern.career.qa.risk": { vi: "Rủi ro", en: "Risks" },
  "chatPanel.eastern.career.qp.direction": { vi: "Hãy gợi ý 2-3 hướng đi nghề nghiệp phù hợp + trade-off của từng hướng.", en: "Suggest 2-3 suitable career directions + trade-offs for each." },
  "chatPanel.eastern.career.qp.skills": { vi: "Hãy đề xuất 5 kỹ năng ưu tiên và 1 kế hoạch 14 ngày để bắt đầu.", en: "Propose 5 priority skills and a 14-day plan to start." },
  "chatPanel.eastern.career.qp.decisions": { vi: "Hãy cho tôi khung ra quyết định 3 bước khi chọn job/dự án.", en: "Give me a 3-step decision framework for choosing a job/project." },
  "chatPanel.eastern.career.qp.risk": { vi: "Hãy nêu rủi ro lớn nhất trong sự nghiệp và cách giảm rủi ro.", en: "Describe the biggest career risk and how to reduce it." },

  "chatPanel.eastern.finance.qa.system": { vi: "Hệ thống tiền", en: "Money system" },
  "chatPanel.eastern.finance.qa.bias": { vi: "Thiên kiến", en: "Biases" },
  "chatPanel.eastern.finance.qa.priority": { vi: "Ưu tiên", en: "Priorities" },
  "chatPanel.eastern.finance.qa.checklist": { vi: "Checklist", en: "Checklist" },
  "chatPanel.eastern.finance.qp.system": { vi: "Hãy gợi ý 1 hệ thống quản trị tiền bạc đơn giản (ngân sách, tích lũy, giới hạn rủi ro).", en: "Suggest a simple money system (budgeting, saving, risk limits)." },
  "chatPanel.eastern.finance.qp.bias": { vi: "Hãy chỉ ra 2-3 thiên kiến ra quyết định tiền bạc và cách khắc phục.", en: "Point out 2-3 money decision biases and how to fix them." },
  "chatPanel.eastern.finance.qp.priority": { vi: "Hãy giúp tôi đặt thứ tự ưu tiên tài chính 3-6 tháng tới.", en: "Help me prioritize my finances for the next 3-6 months." },
  "chatPanel.eastern.finance.qp.checklist": { vi: "Hãy đưa checklist 10 mục trước khi đưa ra quyết định tài chính lớn.", en: "Provide a 10-item checklist before making a big financial decision." },

  "chatPanel.eastern.marriage.qa.needs": { vi: "Nhu cầu", en: "Needs" },
  "chatPanel.eastern.marriage.qa.conflict": { vi: "Xung đột", en: "Conflicts" },
  "chatPanel.eastern.marriage.qa.criteria": { vi: "Tiêu chí", en: "Criteria" },
  "chatPanel.eastern.marriage.qa.questions": { vi: "Câu hỏi", en: "Questions" },
  "chatPanel.eastern.marriage.qp.needs": { vi: "Hãy làm rõ nhu cầu quan hệ cốt lõi của tôi và điều tôi thường né tránh.", en: "Clarify my core relationship needs and what I usually avoid." },
  "chatPanel.eastern.marriage.qp.conflict": { vi: "Hãy nêu 3 điểm dễ xung đột và cách giao tiếp/đặt ranh giới.", en: "List 3 likely conflict areas and how to communicate/set boundaries." },
  "chatPanel.eastern.marriage.qp.criteria": { vi: "Hãy gợi ý tiêu chí lựa chọn/đồng hành phù hợp (thực tế, không định mệnh).", en: "Suggest practical criteria for choosing/partnering (non-fate-based)." },
  "chatPanel.eastern.marriage.qp.questions": { vi: "Hãy gợi ý 10 câu hỏi nên trao đổi với đối tác để tránh hiểu lầm.", en: "Suggest 10 questions to discuss with a partner to avoid misunderstandings." },

  "chatPanel.eastern.health.qa.stress": { vi: "Stress", en: "Stress" },
  "chatPanel.eastern.health.qa.habits": { vi: "Thói quen", en: "Habits" },
  "chatPanel.eastern.health.qa.rhythm": { vi: "Nhịp sống", en: "Daily rhythm" },
  "chatPanel.eastern.health.qa.doctor": { vi: "Khi nào cần gặp bác sĩ", en: "When to see a doctor" },
  "chatPanel.eastern.health.qp.stress": { vi: "Hãy chỉ ra dấu hiệu stress dễ gặp và 3 cách hạ nhiệt trong 10 phút.", en: "Identify common stress signs and 3 ways to cool down in 10 minutes." },
  "chatPanel.eastern.health.qp.habits": { vi: "Hãy gợi ý 5 thói quen wellbeing (ngủ, vận động, ăn uống) dễ áp dụng.", en: "Suggest 5 easy wellbeing habits (sleep, movement, nutrition)." },
  "chatPanel.eastern.health.qp.rhythm": { vi: "Hãy đề xuất lịch sinh hoạt mẫu 1 ngày để ổn định năng lượng.", en: "Propose a sample day schedule to stabilize energy." },
  "chatPanel.eastern.health.qp.doctor": { vi: "Hãy nêu các dấu hiệu nên gặp chuyên gia y tế (không chẩn đoán).", en: "List signs to consult a healthcare professional (no diagnosis)." },

  "chatPanel.eastern.fortune.qa.theme": { vi: "Chủ đề giai đoạn", en: "Phase theme" },
  "chatPanel.eastern.fortune.qa.checklist": { vi: "Checklist", en: "Checklist" },
  "chatPanel.eastern.fortune.qa.opportunity": { vi: "Cơ hội", en: "Opportunities" },
  "chatPanel.eastern.fortune.qa.risk": { vi: "Rủi ro", en: "Risks" },
  "chatPanel.eastern.fortune.qp.theme": { vi: "Hãy tóm tắt chủ đề của giai đoạn hiện tại và 2-3 ưu tiên.", en: "Summarize the theme of the current phase and 2-3 priorities." },
  "chatPanel.eastern.fortune.qp.checklist": { vi: "Hãy đưa checklist chuẩn bị cho 1-2 tháng tới theo hướng kiểm soát được.", en: "Provide a controllable checklist for the next 1-2 months." },
  "chatPanel.eastern.fortune.qp.opportunity": { vi: "Hãy nêu cơ hội nên chủ động nắm và cách hành động an toàn.", en: "Describe opportunities to pursue and how to act safely." },
  "chatPanel.eastern.fortune.qp.risk": { vi: "Hãy nêu rủi ro/áp lực có thể gặp và dấu hiệu cảnh báo sớm.", en: "Describe potential risks/pressures and early warning signs." },

  "chatPanel.eastern.upload.qa.summary": { vi: "Tóm tắt", en: "Summary" },
  "chatPanel.eastern.upload.qa.career": { vi: "Sự nghiệp", en: "Career" },
  "chatPanel.eastern.upload.qa.love": { vi: "Tình cảm", en: "Relationships" },
  "chatPanel.eastern.upload.qa.palaces": { vi: "Hỏi theo cung", en: "Ask by palace" },
  "chatPanel.eastern.upload.qp.summary": { vi: "Hãy tóm tắt lá số này trong 7-10 ý chính.", en: "Summarize this chart in 7-10 key points." },
  "chatPanel.eastern.upload.qp.career": { vi: "Dựa trên kết quả vừa luận giải, hãy tư vấn sự nghiệp theo hướng thực tế (không định mệnh).", en: "Based on the reading, advise on career in a practical way (non-fate-based)." },
  "chatPanel.eastern.upload.qp.love": { vi: "Dựa trên kết quả vừa luận giải, hãy phân tích tình cảm/hôn nhân và lời khuyên.", en: "Based on the reading, analyze relationships and provide advice." },
  "chatPanel.eastern.upload.qp.palaces": { vi: "Hãy gợi ý 5 câu hỏi hay để hỏi theo 12 cung.", en: "Suggest 5 good questions to ask across the 12 palaces." },

  "chatPanel.eastern.welcome.career": { vi: "Chào bạn! Mình sẽ tập trung vào Sự nghiệp & Công danh dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về công việc hiện tại, hướng đi phù hợp, hay cách ra quyết định?", en: "Hi! I'll focus on career based on your input. Do you want to discuss your current job, suitable directions, or decision-making?" },
  "chatPanel.eastern.welcome.finance": { vi: "Chào bạn! Mình sẽ tập trung vào Tài chính & Tài vận dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về tích lũy, quản trị rủi ro, hay thói quen tiền bạc?", en: "Hi! I'll focus on finance based on your input. Do you want to discuss saving, risk management, or money habits?" },
  "chatPanel.eastern.welcome.marriage": { vi: "Chào bạn! Mình sẽ tập trung vào Hôn nhân & Gia đạo dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về mối quan hệ hiện tại, tiêu chí phù hợp, hay cách giao tiếp/đặt ranh giới?", en: "Hi! I'll focus on relationships based on your input. Do you want to discuss your current relationship, compatibility criteria, or boundaries/communication?" },
  "chatPanel.eastern.welcome.health": { vi: "Chào bạn! Mình sẽ tập trung vào Sức khoẻ & Phúc đức theo hướng wellbeing dựa trên thông tin bạn cung cấp. Bạn muốn hỏi về thói quen, quản lý stress, hay nhịp sinh hoạt?", en: "Hi! I'll focus on wellbeing based on your input. Do you want to discuss habits, stress management, or daily rhythm?" },
  "chatPanel.eastern.welcome.fortune": { vi: "Chào bạn! Mình sẽ tập trung vào Thời vận (Đại vận/Tiểu vận) theo hướng tham khảo dựa trên thông tin bạn cung cấp. Bạn muốn xem giai đoạn nào hoặc một mốc thời gian cụ thể?", en: "Hi! I'll focus on life cycles as a reference. Which period or time window do you want to explore?" },
  "chatPanel.eastern.welcome.upload": { vi: "Chào bạn! Mình sẽ dựa trên lá số bạn đã tải lên để trả lời. Bạn muốn làm rõ phần nào trước?", en: "Hi! I'll answer based on your uploaded chart. Which area do you want to start with?" },
  "chatPanel.eastern.welcome.default": { vi: "Chào bạn! Mình sẽ dựa trên thông tin bạn cung cấp để phản chiếu và gợi ý. Bạn muốn làm rõ phần nào trước?", en: "Hi! I'll reflect and suggest based on your input. Which area do you want to clarify first?" },
  "disclaimer.title": { vi: "Tuyên Bố Miễn Trừ", en: "Disclaimer" },
  "disclaimer.p1": { vi: "Fatelytic là nền tảng tự suy ngẫm và phát triển cá nhân. Tất cả phân tích và gợi ý AI được thiết kế để hỗ trợ tự hiểu bản thân, không phải để dự đoán tương lai hay khẳng định số phận.", en: "Fatelytic is a self-reflection and personal development platform. All readings and AI-generated insights are designed to support self-understanding, not to predict the future." },
  "disclaimer.p2": { vi: "Thần số học, chiêm tinh và các công cụ khác được diễn giải qua góc nhìn tâm lý và coaching. Chúng hoạt động như khung tự khám phá, tương tự các bài đánh giá tính cách.", en: "The numerology, astrology, and other tools are reframed through a psychological and coaching lens, similar to personality assessments." },
  "disclaimer.p3": { vi: "Nền tảng này không cung cấp tư vấn y tế, pháp lý, tài chính hoặc chuyên môn. Nếu bạn gặp vấn đề sức khỏe tâm thần, vui lòng liên hệ chuyên gia.", en: "This platform does not provide medical, legal, financial, or professional advice. Please consult a licensed professional if needed." },
  "disclaimer.p4": { vi: "Tất cả nội dung AI được tạo bởi mô hình ngôn ngữ và nên được coi là gợi ý, không phải chỉ dẫn tuyệt đối. Chúng tôi khuyến khích tư duy phản biện.", en: "All AI content is generated by language models and should be treated as suggestive rather than authoritative." },
  "disclaimer.footer": { vi: "Nội dung này chỉ nhằm mục đích tự hiểu bản thân và suy ngẫm.", en: "This content is for self-understanding and reflection purposes only." },

  // Placeholder modules
  "placeholder.backToDashboard": { vi: "Về Bảng Điều Khiển", en: "Back to Dashboard" },
  "placeholder.eastern.title": { vi: "Tử Vi Phương Đông", en: "Eastern Astrology" },
  "placeholder.eastern.desc": { vi: "Phân tích Tử Vi và Bát Tự sắp ra mắt. Module này sẽ cung cấp phân tích sâu về tính cách và nghề nghiệp.", en: "Tu Vi and Bazi analysis is coming soon." },
  "placeholder.western.title": { vi: "Chiêm Tinh Phương Tây", en: "Western Astrology" },
  "placeholder.western.desc": { vi: "Giải đọc bản đồ sao qua lăng kính tâm lý hiện đại. Sắp ra mắt.", en: "Birth chart interpretation through a modern psychological lens. Coming soon." },
  "placeholder.tarot.title": { vi: "Tarot", en: "Tarot" },
  "placeholder.tarot.desc": { vi: "Đọc bài Tarot suy ngẫm giúp bạn ra quyết định rõ ràng. Sắp ra mắt.", en: "Reflective card readings for decision-making clarity. Coming soon." },
  "placeholder.iching.title": { vi: "Kinh Dịch", en: "I Ching" },
  "placeholder.iching.desc": { vi: "Trí tuệ cổ đại được diễn giải qua góc nhìn tâm lý. Sắp ra mắt.", en: "Ancient wisdom reframed as psychological guidance. Coming soon." },
  "placeholder.career.title": { vi: "Tư Vấn Nghề Nghiệp AI", en: "Career AI" },
  "placeholder.career.desc": { vi: "Tư vấn nghề nghiệp bằng AI dựa trên hồ sơ tự khám phá. Sắp ra mắt.", en: "AI-powered career coaching based on your full profile. Coming soon." },

  // Upload
  "upload.title": { vi: "Tải Lên Bản Đồ Sao", en: "Upload Birth Chart" },
  "upload.subtitle": { vi: "Tải lên ảnh lá số Tử Vi để phân tích bằng AI.", en: "Upload your birth chart image for AI-powered analysis." },
  "upload.click": { vi: "Nhấn để tải lên bản đồ", en: "Click to upload your chart" },
  "upload.formats": { vi: "PNG, JPG", en: "PNG, JPG" },
  "upload.analyze": { vi: "Phân Tích Bản Đồ", en: "Analyze Chart" },
  "upload.note": { vi: "Tăng độ chính xác bằng cách cung cấp ảnh rõ nét.", en: "Use a clear image for best accuracy." },
  "upload.invalidFile": { vi: "Vui lòng chọn ảnh hợp lệ", en: "Please choose a valid image" },
  "upload.missingProfile": { vi: "Thiếu hồ sơ người dùng", en: "Missing user profile" },
  "upload.analyzing": { vi: "Đang phân tích...", en: "Analyzing..." },
  "upload.error": { vi: "Không thể phân tích lúc này", en: "Unable to analyze right now" },
  "upload.overviewTitle": { vi: "Tổng quan", en: "Overview" },
  "upload.prompt": { vi: "Luận giải lá số Tử Vi từ hình ảnh đính kèm. Trả về JSON theo mục mặc định.", en: "Interpret the attached Tu Vi chart image. Return JSON using the default sections." },

  // Eastern astrology
  "eastern.uploadTitle": { vi: "Tải lên lá số", en: "Upload chart" },
  "eastern.uploadDesc": { vi: "Phân tích sâu dựa trên hình ảnh lá số.", en: "Deep analysis based on the chart image." },
  "eastern.back": { vi: "Quay lại", en: "Back" },
  "eastern.history": { vi: "Lịch sử", en: "History" },
  "eastern.upload.chooseChart": { vi: "Tải Lá Số", en: "Upload Chart" },
  "eastern.upload.formats": { vi: "Hỗ trợ PNG, JPEG", en: "Supports PNG, JPEG" },
  "eastern.upload.start": { vi: "Bắt đầu luận giải", en: "Start analysis" },
  "eastern.upload.note": { vi: "Ảnh sẽ được phân tích và luận giải chi tiết.", en: "The image will be analyzed and explained in detail." },
"eastern.upload.slowNote": {
  "vi": "Quá trình phân tích có thể mất từ 1–3 phút tuỳ chất lượng ảnh và tải hệ thống. Vui lòng kiên nhẫn chờ.",
  "en": "Analysis may take 1–3 minutes depending on image quality and system load. Please wait."
},

  "eastern.option.upload.label": { vi: "Tải Lá Số", en: "Upload Chart" },
"eastern.option.upload.desc": {
  "vi": "Khám phá bản thân qua lá số Tử Vi.",
  "en": "Explore yourself through your Tu Vi chart."
},
  "eastern.option.upload.prompt": { vi: "Luận giải chi tiết lá số tử vi từ ảnh", en: "Analyze this Tu Vi chart in detail based on the image" },

  "eastern.option.savedChart.label": { vi: "Lá Số", en: "Saved Chart" },
  "eastern.option.overview.label": { vi: "Tổng quan", en: "Overview" },
"eastern.option.overview.desc": {
  "vi": "Bức tranh tổng thể về tính cách và cuộc sống",
  "en": "A general overview of your personality and life path"
},
  "eastern.option.overview.prompt": { vi: "Hãy luận giải tổng quan Tử Vi/Bát Tự dựa trên thông tin cá nhân của tôi.", en: "Provide an overview reading (Tu Vi/Bazi) based on my profile." },
  "eastern.option.career.label": { vi: "Sự nghiệp & Công danh", en: "Career" },
"eastern.option.career.desc": {
  "vi": "Phân tích xu hướng sự nghiệp và định hướng phát triển",
  "en": "Insights into your career tendencies and growth direction"
},
  "eastern.option.career.prompt": { vi: "Hãy phân tích sự nghiệp/công danh dựa trên thông tin cá nhân của tôi. Nêu rõ điểm mạnh, điểm yếu, rủi ro và gợi ý hành động.", en: "Analyze my career: strengths, weaknesses, risks, and suggested actions." },
  "eastern.option.marriage.label": { vi: "Hôn nhân & Gia đạo", en: "Relationships" },
"eastern.option.marriage.desc": {
  "vi": "Góc nhìn về tình duyên và mối quan hệ gia đình",
  "en": "Insights into love life and family relationships"
},
  "eastern.option.marriage.prompt": { vi: "Hãy phân tích tình duyên/hôn nhân & gia đạo dựa trên thông tin cá nhân của tôi. Tránh dự đoán định mệnh; ưu tiên gợi ý thực tế.", en: "Analyze relationships in a practical way (avoid fate-based claims)." },
  "eastern.option.finance.label": { vi: "Tài chính & Tài vận", en: "Finance" },
"eastern.option.finance.desc": {
  "vi": "Đánh giá khuynh hướng tài chính",
  "en": "Analysis of your financial tendencies"
},
  "eastern.option.finance.prompt": { vi: "Hãy phân tích tài chính/tài vận dựa trên thông tin cá nhân của tôi. Tập trung vào thói quen tiền bạc, rủi ro và hệ thống quản trị.", en: "Analyze my finances: money habits, risks, and a simple management system." },
  "eastern.option.health.label": { vi: "Sức khoẻ & Phúc đức", en: "Wellbeing" },
"eastern.option.health.desc": {
  "vi": "Gợi ý chăm sóc sức khỏe và cân bằng tinh thần",
  "en": "Guidance on wellbeing and mental balance"
},
  "eastern.option.health.prompt": { vi: "Hãy phân tích sức khỏe/phúc đức theo hướng wellbeing dựa trên thông tin cá nhân của tôi. Không chẩn đoán y khoa; chỉ gợi ý lối sống.", en: "Analyze wellbeing (no medical diagnosis); provide lifestyle suggestions." },
  "eastern.option.fortune.label": { vi: "Thời vận & Đại vận", en: "Life cycles" },
"eastern.option.fortune.desc": {
  "vi": "Chủ đề nổi bật theo từng giai đoạn cuộc đời",
  "en": "Key themes across different life phases"
},
  "eastern.option.fortune.prompt": { vi: "Hãy luận giải thời vận theo chủ đề giai đoạn (Đại vận/Tiểu vận) dựa trên thông tin cá nhân của tôi. Tránh khẳng định chắc chắn; đưa checklist chuẩn bị.", en: "Interpret life cycles by phase themes; avoid certainty; include a preparation checklist." },
  "eastern.option.image.label": { vi: "Ảnh minh hoạ người hôn phối", en: "Partner portrait" },
"eastern.option.image.desc": {
  "vi": "Tạo ảnh minh hoạ về người bạn đời",
  "en": "Generate an illustration of your partner"
},

  "eastern.image.inputOptions.title": { vi: "Tuỳ chọn đầu vào", en: "Input options" },
  "eastern.image.inputOptions.desc": { vi: "Hệ thống sẽ tạo ảnh dựa trên dữ liệu lá số đã lưu và hồ sơ của bạn.", en: "We'll generate the image based on your saved chart data and profile." },
  "eastern.image.portraitOptional": { vi: "Chân dung (tuỳ chọn)", en: "Portrait (optional)" },
  "eastern.image.portraitClick": { vi: "Nhấn để tải ảnh chân dung", en: "Click to upload a portrait" },
  "eastern.image.chartOptional": { vi: "Lá số Tử Vi (tuỳ chọn)", en: "Chart (optional)" },
  "eastern.image.chartClick": { vi: "Nhấn để tải ảnh lá số", en: "Click to upload a chart" },
  "eastern.image.generate": { vi: "Tạo ảnh", en: "Generate image" },
  "eastern.image.generating": { vi: "Đang tạo...", en: "Generating..." },
  "eastern.image.clearInputs": { vi: "Xoá đầu vào", en: "Clear inputs" },
  "eastern.image.slowTitle": { vi: "Tạo ảnh có thể mất vài phút", en: "Image generation may take a few minutes" },
  "eastern.image.slowDesc": {
    vi: "Hệ thống sẽ tạo ảnh dựa trên dữ liệu lá số đã lưu và hồ sơ của bạn. Quá trình này có thể mất vài phút — hãy giữ tab mở trong lúc xử lý.",
    en: "We'll generate the image based on your saved chart data and profile. This can take a few minutes — please keep this tab open while we work.",
  },

  "eastern.profileReading.title": { vi: "Luận giải theo hồ sơ", en: "Profile-based reading" },
  "eastern.profileReading.desc": { vi: "Hệ thống sẽ phân tích và trình bày theo từng mục để bạn xem nhanh.", en: "We'll analyze and present the results in sections for quick reading." },
  "eastern.profileReading.start": { vi: "Bắt đầu luận giải", en: "Start reading" },
  "eastern.profileReading.analyzing": { vi: "Đang phân tích...", en: "Analyzing..." },
  "eastern.loading.title": { vi: "Đang phân tích kết quả", en: "Analyzing results" },
  "eastern.loading.desc": { vi: "Bạn có thể cuộn để xem nội dung xuất hiện dần khi có dữ liệu.", en: "You can scroll to see content appear gradually as data arrives." },
  "eastern.questionLabel": { vi: "Bạn muốn hỏi thêm điều gì?", en: "Any specific question?" },
  "eastern.questionPlaceholder": { vi: "Ví dụ: Tình duyên, sự nghiệp, sức khỏe...", en: "e.g. relationships, career, health..." },
  "eastern.analyze": { vi: "Luận giải tổng quan", en: "Analyze overview" },
  "eastern.analyzing": { vi: "Đang phân tích...", en: "Analyzing..." },
  "eastern.profileSummary": { vi: "Hồ sơ:", en: "Profile:" },
  "eastern.defaultSections": { vi: "Mục mặc định", en: "Default sections" },
  "eastern.overviewTitle": { vi: "Tổng quan", en: "Overview" },
  "eastern.error": { vi: "Không thể phân tích lúc này", en: "Failed to analyze" },
  "eastern.missingProfile": { vi: "Chưa có hồ sơ người dùng", en: "Profile missing" },
  "eastern.toast.invalidImage": { vi: "Vui lòng chọn ảnh PNG hoặc JPEG.", en: "Please select a PNG or JPEG image." },
  "eastern.toast.imageGenerateFailed": { vi: "Không thể tạo ảnh lúc này. Vui lòng thử lại.", en: "Unable to generate the image right now. Please try again." },
  "eastern.toast.missingChartImage": { vi: "Vui lòng chọn ảnh lá số.", en: "Please select a chart image." },
  "eastern.toast.missingSavedChart": { vi: "Chưa có lá số đã lưu trong hồ sơ. Vui lòng cập nhật hồ sơ trước.", en: "No saved chart found in your profile. Please update your profile first." },
  "eastern.toast.invalidJson": { vi: "Kết quả trả về không đúng định dạng JSON. Vui lòng thử lại.", en: "The result is not valid JSON. Please try again." },

  // NotFound
  "notFound.title": { vi: "Không Tìm Thấy Trang", en: "Page not found" },
  "notFound.back": { vi: "Về Trang Chủ", en: "Return to Home" },

  // Footer
"footer.disclaimer": {
  "vi": "Lưu ý",
  "en": "Disclaimer"
},
"footer.forReflection": {
  "vi": "Nền tảng này phục vụ mục đích tự suy ngẫm và hiểu bản thân, không phải dự đoán số phận.",
  "en": "This platform is for self-reflection and personal understanding, not fate prediction."
},

  // SEO
  "seo.home.title": { vi: "Fatelytic — Khám Phá Bản Thân Qua Phân Tích Tâm Lý", en: "Fatelytic — Self-Discovery Through Psychology-Based Insights" },
  "seo.home.desc": { vi: "Nền tảng khám phá bản thân và định hướng nghề nghiệp hiện đại sử dụng thần số học như công cụ tâm lý.", en: "A modern self-discovery and career guidance platform using numerology as a psychological tool." },
  "seo.calc.title": { vi: "Xem Thần Số Học | Fatelytic", en: "Numerology Reading | Fatelytic" },
  "seo.calc.desc": { vi: "Nhập họ tên và ngày sinh để nhận phân tích thần số học dựa trên tâm lý học.", en: "Enter your name and date of birth for a psychology-based numerology analysis." },
  "seo.result.title": { vi: "Kết Quả Thần Số Học | Fatelytic", en: "Numerology Results | Fatelytic" },
  "seo.result.desc": { vi: "Xem hồ sơ thần số học cá nhân với Số Chủ Đạo, điểm mạnh và gợi ý nghề nghiệp.", en: "View your numerology profile with Life Path Number, strengths and career suggestions." },
  "seo.chat.title": { vi: "Tư Vấn AI | Fatelytic", en: "AI Advisor | Fatelytic" },
  "seo.chat.desc": { vi: "Trò chuyện với tư vấn viên AI dựa trên tâm lý học về nghề nghiệp và phát triển cá nhân.", en: "Chat with a psychology-based AI advisor about career and personal growth." },
  "seo.dashboard.title": { vi: "Bảng Điều Khiển | Fatelytic", en: "Dashboard | Fatelytic" },
  "seo.dashboard.desc": { vi: "Khám phá các công cụ tự hiểu bản thân: Thần số học, Tử Vi, Tarot và nhiều hơn nữa.", en: "Explore self-discovery tools: Numerology, Astrology, Tarot and more." },
  "seo.login.title": { vi: "Đăng Nhập | Fatelytic", en: "Sign In | Fatelytic" },
  "seo.login.desc": { vi: "Đăng nhập hoặc tạo tài khoản Fatelytic để bắt đầu hành trình khám phá bản thân.", en: "Sign in or create a Fatelytic account to start your self-discovery journey." },
  "seo.history.title": { vi: "Lịch Sử | Fatelytic", en: "History | Fatelytic" },
  "seo.history.desc": { vi: "Xem lại các bài phân tích thần số học trước đây của bạn.", en: "View your past numerology readings and insights." },
  "seo.disclaimer.title": { vi: "Tuyên Bố Miễn Trừ | Fatelytic", en: "Disclaimer | Fatelytic" },
  "seo.disclaimer.desc": { vi: "Fatelytic là nền tảng tự suy ngẫm và phát triển cá nhân, không phải bói toán.", en: "Fatelytic is a self-reflection platform, not fortune-telling." },
  "seo.eastern.title": { vi: "Tử Vi Phương Đông | Fatelytic", en: "Eastern Astrology | Fatelytic" },
  "seo.eastern.desc": { vi: "Luận giải Tử Vi/Bát Tự như công cụ phản chiếu tâm lý và định hướng nghề nghiệp.", en: "Eastern astrology insights as a psychological reflection tool for career alignment." },
  "seo.upload.title": { vi: "Tải Lên Lá Số | Fatelytic", en: "Upload Chart | Fatelytic" },
  "seo.upload.desc": { vi: "Tải ảnh lá số để nhận phân tích AI chi tiết dựa trên hồ sơ cá nhân.", en: "Upload a chart image for detailed AI analysis based on your profile." },
  "seo.western.title": { vi: "Chiêm Tinh Phương Tây | Fatelytic", en: "Western Astrology | Fatelytic" },
  "seo.western.desc": { vi: "Chiêm tinh Tây phương dưới góc nhìn tâm lý học và tự phát triển.", en: "Western astrology interpreted through a psychological growth lens." },
  "seo.tarot.title": { vi: "Tarot | Fatelytic", en: "Tarot | Fatelytic" },
  "seo.tarot.desc": { vi: "Tarot phản chiếu để hỗ trợ quyết định và cảm xúc hiện tại.", en: "Reflective Tarot guidance for decisions and emotions." },
  "seo.iching.title": { vi: "Kinh Dịch | Fatelytic", en: "I Ching | Fatelytic" },
  "seo.iching.desc": { vi: "Kinh Dịch cho tự suy ngẫm và hành động thực tế.", en: "I Ching for reflection and practical action." },
  "seo.career.title": { vi: "Tư Vấn Nghề Nghiệp AI | Fatelytic", en: "Career AI | Fatelytic" },
  "seo.career.desc": { vi: "Tư vấn nghề nghiệp dựa trên hồ sơ tự khám phá và phân tích AI.", en: "Career coaching powered by your self-discovery profile." },
  "seo.notFound.title": { vi: "Không Tìm Thấy Trang | Fatelytic", en: "Page Not Found | Fatelytic" },
  "seo.notFound.desc": { vi: "Trang bạn yêu cầu không tồn tại hoặc đã bị di chuyển.", en: "The page you requested does not exist or has moved." },
  "seo.overview.title": { vi: "Tổng Quan | Fatelytic", en: "Overview | Fatelytic" },
  "seo.overview.desc": { vi: "Fatelytic — nền tảng khám phá bản thân qua phân tích tâm lý và tử vi. Tính năng tổng quan sắp ra mắt.", en: "Fatelytic overview — coming soon." },
  "overview.title": { vi: "Tổng Quan", en: "Overview" },
  "overview.subtitle": { vi: "Tính năng tổng quan đang được phát triển", en: "Overview feature is under development" },
  "overview.desc": { vi: "Chúng tôi đang xây dựng trang tổng quan giúp bạn theo dõi toàn bộ hành trình khám phá bản thân — từ tử vi, thần số học đến các phân tích cá nhân hoá.", en: "We are building an overview page." },
  "overview.comingSoon": { vi: "Sắp Ra Mắt", en: "Coming Soon" },
  "overview.tryEastern": { vi: "Thử Tử Vi Phương Đông", en: "Try Eastern Astrology" },
  "overview.explore": { vi: "Khám Phá Công Cụ", en: "Explore Tools" },
  "seo.authCallback.title": { vi: "Đang Đăng Nhập | Fatelytic", en: "Signing In | Fatelytic" },
  "seo.authCallback.desc": { vi: "Đang hoàn tất đăng nhập và chuyển hướng.", en: "Completing sign in and redirecting." },
  "seo.profile.title": { vi: "Trang Cá Nhân | Fatelytic", en: "Profile | Fatelytic" },
  "seo.profile.desc": { vi: "Xem và chỉnh sửa thông tin cá nhân trên Fatelytic.", en: "View and edit your personal information on Fatelytic." },
  "nav.profile": { vi: "Trang Cá Nhân", en: "Profile" },
  "seo.terms.title": { vi: "Điều Khoản Sử Dụng | Fatelytic", en: "Terms of Service | Fatelytic" },
  "seo.terms.desc": { vi: "Điều khoản sử dụng dịch vụ Fatelytic.", en: "Fatelytic terms of service." },
  "seo.privacy.title": { vi: "Chính Sách Bảo Mật | Fatelytic", en: "Privacy Policy | Fatelytic" },
  "seo.privacy.desc": { vi: "Chính sách bảo mật thông tin người dùng Fatelytic.", en: "Fatelytic privacy policy." },
} as const satisfies TranslationDict;
