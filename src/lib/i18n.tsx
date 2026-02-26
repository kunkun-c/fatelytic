import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { APP_STORAGE_PREFIX } from "@/lib/brand";

export type Lang = "vi";

const translations = {
  // Common
  "app.name": { vi: "Fatelytic", en: "Fatelytic" },
  "app.tagline": { vi: "Khám Phá Bản Thân Qua Tâm Lý Học & Con Số", en: "Self-Discovery Through Psychology & Numbers" },

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
  "landing.hero.subtitle": { vi: "Nền tảng khám phá bản thân hiện đại, sử dụng thần số học như công cụ tâm lý để định hướng nghề nghiệp và phát triển cá nhân.", en: "A modern self-discovery platform that uses numerology as a psychological tool for career guidance and personal growth." },
  "landing.hero.cta": { vi: "Xem Tử Vi Miễn Phí", en: "Try Free Eastern Astrology Reading" },
  "landing.hero.explore": { vi: "Khám Phá Tất Cả Công Cụ", en: "Explore All Tools" },
  "landing.howItWorks": { vi: "Cách Hoạt Động", en: "How It Works" },
  "landing.howItWorksDesc": { vi: "Dựa trên tâm lý học, được hỗ trợ bởi phân tích chuyên sâu.", en: "Grounded in psychology, powered by thoughtful analysis." },
  "landing.feature1.title": { vi: "Phân Tích AI Cá Nhân Hóa", en: "Personalized AI Interpretation" },
  "landing.feature1.desc": { vi: "Nhận phân tích dựa trên tâm lý học, phù hợp với hồ sơ riêng của bạn.", en: "Get psychology-based insights tailored to your unique profile." },
  "landing.feature2.title": { vi: "Định Hướng Nghề Nghiệp", en: "Career Guidance" },
  "landing.feature2.desc": { vi: "Khám phá con đường sự nghiệp phù hợp với thế mạnh tự nhiên của bạn.", en: "Discover career paths aligned with your natural strengths." },
  "landing.feature3.title": { vi: "Phân Tích Cuộc Sống", en: "Daily Life Insights" },
  "landing.feature3.desc": { vi: "Gợi ý thực tế giúp bạn trong các mối quan hệ, quyết định và phát triển.", en: "Actionable reflections to help you navigate relationships and growth." },
  "landing.feature4.title": { vi: "Riêng Tư & An Toàn", en: "Private and Secure" },
  "landing.feature4.desc": { vi: "Dữ liệu của bạn luôn thuộc về bạn. Không chia sẻ, không theo dõi.", en: "Your data stays yours. No sharing, no tracking." },
  "landing.disclaimer": { vi: "Nền tảng này cung cấp công cụ tự suy ngẫm, không phải dự đoán số phận.", en: "This platform provides self-reflection tools, not destiny prediction." },

  // Calculator
  "calc.title": { vi: "Xem Thần Số Học", en: "Numerology Reading" },
  "calc.subtitle": { vi: "Nhập thông tin của bạn để nhận phân tích tâm lý học cá nhân.", en: "Enter your details for a personalized psychology-based analysis." },
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

  // Chat
  "chat.title": { vi: "Tư Vấn", en: "Consultation" },
  "chat.subtitle": { vi: "Đồng hành cùng bạn trên hành trình tự khám phá.", en: "Your self-discovery companion." },
  "chat.placeholder": { vi: "Hỏi về nghề nghiệp, thế mạnh, phát triển cá nhân...", en: "Ask about your career, strengths, growth..." },
  "chat.welcome": { vi: "Xin chào! Tôi là tư vấn viên chuyên về phân tích tâm lý và phát triển bản thân. Hãy chọn một chủ đề bên dưới hoặc đặt câu hỏi bất kỳ.", en: "Hello! I'm your self-discovery consultant. Choose a topic below or ask anything." },

  // Dashboard
  "dashboard.title": { vi: "Khám Phá", en: "Discover" },
  "dashboard.subtitle": { vi: "Khám phá các công cụ tự hiểu bản thân dựa trên tâm lý học.", en: "Explore self-discovery tools grounded in psychology." },
  "dashboard.comingSoon": { vi: "Sắp ra mắt thêm nhiều công cụ. Mỗi module được thiết kế như công cụ tự suy ngẫm tâm lý.", en: "More tools coming soon. Each module is designed as a psychological self-reflection tool." },
  "dashboard.numerology.desc": { vi: "Khám phá Số Chủ Đạo và định hướng nghề nghiệp qua tâm lý số học.", en: "Discover your Life Path and career alignment through number psychology." },
  "dashboard.eastern.desc": { vi: "Phân tích Tử Vi và Bát Tự để hiểu sâu hơn về bản thân.", en: "Tu Vi and Bazi analysis for deeper self-understanding." },
  "dashboard.western.desc": { vi: "Giải đọc bản đồ sao qua lăng kính tâm lý hiện đại.", en: "Birth chart interpretation through a modern lens." },
  "dashboard.tarot.desc": { vi: "Đọc bài Tarot suy ngẫm giúp ra quyết định rõ ràng.", en: "Reflective card readings for decision-making clarity." },
  "dashboard.iching.desc": { vi: "Trí tuệ cổ đại được diễn giải qua góc nhìn tâm lý.", en: "Ancient wisdom reframed as psychological guidance." },
  "dashboard.career.desc": { vi: "Khai phá con đường nghề nghiệp phù hợp với bộ chỉ số tự khám phá của bạn.", en: "Unlock career paths aligned with your self-discovery profile." },

  // Profile
  "profile.tagline": { vi: "Hồ sơ cá nhân", en: "Personal Profile" },
  "profile.title": { vi: "Hoàn Thiện Thông Tin", en: "Complete Your Profile" },
  "profile.subtitle": { vi: "Giúp hệ thống phân tích chính xác hơn cho tất cả công cụ.", en: "Helps us provide more accurate guidance across tools." },
  "profile.fullName": { vi: "Họ và Tên", en: "Full Name" },
  "profile.fullNamePlaceholder": { vi: "Nhập họ và tên đầy đủ", en: "Enter your full name" },
  "profile.dob": { vi: "Ngày Sinh Dương Lịch", en: "Solar Date of Birth" },
  "profile.timeOfBirth": { vi: "Giờ Sinh (tuỳ chọn)", en: "Time of Birth (optional)" },
  "profile.gender": { vi: "Giới Tính", en: "Gender" },
  "profile.genderPlaceholder": { vi: "Chọn giới tính", en: "Select gender" },
  "profile.placeOfBirth": { vi: "Nơi Sinh", en: "Place of Birth" },
  "profile.placePlaceholder": { vi: "Tỉnh/Thành, Quận/Huyện, Phường/Xã", en: "Province, District, Ward" },
  "profile.province": { vi: "Tỉnh/Thành", en: "Province" },
  "profile.district": { vi: "Quận/Huyện", en: "District" },
  "profile.ward": { vi: "Phường/Xã", en: "Ward" },
  "profile.provincePlaceholder": { vi: "Chọn tỉnh/thành", en: "Select province" },
  "profile.districtPlaceholder": { vi: "Chọn quận/huyện", en: "Select district" },
  "profile.wardPlaceholder": { vi: "Chọn phường/xã", en: "Select ward" },
  "profile.locationLoading": { vi: "Đang tải danh sách...", en: "Loading locations..." },
  "profile.timeNote": { vi: "Giờ sinh có thể bỏ qua, nhưng nếu có sẽ tăng độ chính xác.", en: "Time of birth is optional, but including it improves accuracy." },
  "profile.save": { vi: "Lưu Hồ Sơ", en: "Save Profile" },
  "profile.saving": { vi: "Đang lưu...", en: "Saving..." },
  "profile.fullNameError": { vi: "Vui lòng nhập họ và tên.", en: "Please enter your full name." },
  "profile.dobError": { vi: "Vui lòng chọn ngày sinh.", en: "Please select your date of birth." },
  "profile.placeError": { vi: "Vui lòng nhập nơi sinh.", en: "Please enter your place of birth." },

  // Module pages
  "module.numerology.title": { vi: "Thần Số Học", en: "Numerology" },
  "module.numerology.desc": { vi: "Khám phá Số Chủ Đạo và định hướng nghề nghiệp qua tâm lý số học.", en: "Explore your Life Path and career alignment through psychological numerology." },
  "module.eastern.title": { vi: "Tử Vi Phương Đông", en: "Eastern Astrology" },
  "module.eastern.desc": { vi: "Phân tích Tử Vi và Bát Tự để hiểu sâu hơn về bản thân.", en: "Analyze Tu Vi and Bazi for deeper self-understanding." },
  "module.western.title": { vi: "Chiêm Tinh Phương Tây", en: "Western Astrology" },
  "module.western.desc": { vi: "Giải đọc bản đồ sao qua lăng kính tâm lý hiện đại.", en: "Interpret your birth chart through a modern psychological lens." },
  "module.tarot.title": { vi: "Tarot", en: "Tarot" },
  "module.tarot.desc": { vi: "Đọc bài Tarot suy ngẫm giúp ra quyết định rõ ràng.", en: "Reflective Tarot readings for clearer decisions." },
  "module.iching.title": { vi: "Kinh Dịch", en: "I Ching" },
  "module.iching.desc": { vi: "Trí tuệ cổ đại được diễn giải qua góc nhìn tâm lý.", en: "Ancient wisdom reframed as psychological guidance." },
  "module.career.title": { vi: "Tư Vấn Nghề Nghiệp AI", en: "Career AI" },
  "module.career.desc": { vi: "Tư vấn nghề nghiệp bằng AI dựa trên hồ sơ tự khám phá.", en: "AI career coaching based on your self-discovery profile." },
  "module.start": { vi: "Bắt Đầu Tư Vấn", en: "Start Guidance" },
  "module.promptPlaceholder": { vi: "Nhập câu hỏi hoặc chủ đề bạn muốn khám phá...", en: "Enter the question or topic you want to explore..." },

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

  // History
  "history.title": { vi: "Lịch Sử Xem", en: "Reading History" },
  "history.subtitle": { vi: "Xem lại các bài phân tích trước đây.", en: "View your past readings and insights." },
  "history.empty": { vi: "Chưa có bài phân tích nào", en: "No readings yet" },
  "history.emptyDesc": { vi: "Bắt đầu xem thần số học đầu tiên để lưu lịch sử tại đây.", en: "Start your first numerology reading to see your history here." },
  "history.startReading": { vi: "Bắt Đầu Xem", en: "Start a Reading" },
  "history.view": { vi: "Xem", en: "View" },
  "history.loadError": { vi: "Không thể tải lịch sử", en: "Failed to load readings" },
  "history.deleteError": { vi: "Không thể xóa kết quả", en: "Failed to delete reading" },
  "history.deleteSuccess": { vi: "Đã xóa kết quả", en: "Reading deleted" },

  // Disclaimer
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
  "eastern.instantTitle": { vi: "Luận giải ngay", en: "Instant analysis" },
  "eastern.instantDesc": { vi: "AI luận giải dựa trên hồ sơ đã lưu.", en: "AI interpretation based on your saved profile." },
  "eastern.questionLabel": { vi: "Bạn muốn hỏi thêm điều gì?", en: "Any specific question?" },
  "eastern.questionPlaceholder": { vi: "Ví dụ: Tình duyên, sự nghiệp, sức khỏe...", en: "e.g. relationships, career, health..." },
  "eastern.analyze": { vi: "Luận giải tổng quan", en: "Analyze overview" },
  "eastern.analyzing": { vi: "Đang phân tích...", en: "Analyzing..." },
  "eastern.profileSummary": { vi: "Hồ sơ:", en: "Profile:" },
  "eastern.defaultSections": { vi: "Mục mặc định", en: "Default sections" },
  "eastern.overviewTitle": { vi: "Tổng quan", en: "Overview" },
  "eastern.error": { vi: "Không thể phân tích lúc này", en: "Failed to analyze" },
  "eastern.missingProfile": { vi: "Chưa có hồ sơ người dùng", en: "Profile missing" },

  // NotFound
  "notFound.title": { vi: "Không Tìm Thấy Trang", en: "Page not found" },
  "notFound.back": { vi: "Về Trang Chủ", en: "Return to Home" },

  // Footer
  "footer.disclaimer": { vi: "Tuyên Bố Miễn Trừ", en: "Disclaimer" },
  "footer.forReflection": { vi: "Chỉ nhằm mục đích tự hiểu bản thân và suy ngẫm.", en: "For self-understanding and reflection purposes only." },

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
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey | string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang: Lang = "vi";

  const t = useCallback((key: TranslationKey | string): string => {
    return (translations as Record<string, Record<string, string>>)[key]?.["vi"] || key;
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang: () => {}, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
