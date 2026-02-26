const LETTER_VALUES: Record<string, number> = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};

function reduceToSingle(num: number): number {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num).split('').reduce((sum, d) => sum + parseInt(d), 0);
  }
  return num;
}

export function calculateLifePathNumber(dateOfBirth: string): number {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const monthReduced = reduceToSingle(month);
  const dayReduced = reduceToSingle(day);
  const yearReduced = reduceToSingle(year);
  return reduceToSingle(monthReduced + dayReduced + yearReduced);
}

export function calculateExpressionNumber(fullName: string): number {
  const total = fullName
    .toLowerCase()
    .split('')
    .filter(c => LETTER_VALUES[c])
    .reduce((sum, c) => sum + LETTER_VALUES[c], 0);
  return reduceToSingle(total);
}

export function calculateSoulUrgeNumber(fullName: string): number {
  const vowels = 'aeiou';
  const total = fullName
    .toLowerCase()
    .split('')
    .filter(c => vowels.includes(c) && LETTER_VALUES[c])
    .reduce((sum, c) => sum + LETTER_VALUES[c], 0);
  return reduceToSingle(total);
}

export interface NumerologyResult {
  lifePathNumber: number;
  expressionNumber: number;
  soulUrgeNumber: number;
  strengths: string[];
  challenges: string[];
  careerSuggestions: string[];
  relationshipStyle: string;
  description: string;
}

type LifePathEntry = Omit<NumerologyResult, 'lifePathNumber' | 'expressionNumber' | 'soulUrgeNumber'>;

const LIFE_PATH_DATA_VI: Record<number, LifePathEntry> = {
  1: {
    description: "Bạn là người lãnh đạo bẩm sinh với động lực mạnh mẽ hướng tới sự độc lập. Con đường của bạn khuyến khích phát triển sự tự tin và tính sáng tạo.",
    strengths: ["Lãnh đạo", "Độc lập", "Sáng tạo", "Quyết đoán", "Dũng cảm"],
    challenges: ["Bướng bỉnh", "Thiếu kiên nhẫn", "Xu hướng làm việc quá sức", "Khó nhờ giúp đỡ"],
    careerSuggestions: ["Doanh nhân", "Giám đốc", "Freelancer", "Nhà phát minh", "Quản lý dự án"],
    relationshipStyle: "Bạn coi trọng sự độc lập trong các mối quan hệ và tìm kiếm người bạn đời tôn trọng sự tự chủ của bạn đồng thời chia sẻ tầm nhìn đầy tham vọng.",
  },
  2: {
    description: "Bạn là nhà ngoại giao và người hòa giải tự nhiên. Sự nhạy cảm và trực giác giúp bạn hiểu rõ nhu cầu của người khác.",
    strengths: ["Ngoại giao", "Đồng cảm", "Hợp tác", "Kiên nhẫn", "Chú ý chi tiết"],
    challenges: ["Quá nhạy cảm", "Thiếu quyết đoán", "Muốn làm hài lòng mọi người", "Nghi ngờ bản thân"],
    careerSuggestions: ["Tư vấn viên", "Hòa giải viên", "Giáo viên", "Chuyên viên nhân sự", "Nhân viên xã hội"],
    relationshipStyle: "Bạn phát triển tốt trong các mối quan hệ hài hòa, kết nối sâu sắc, tự nhiên biết nuôi dưỡng và hỗ trợ.",
  },
  3: {
    description: "Bạn sáng tạo, giàu biểu cảm và năng động trong xã hội. Con đường của bạn là sử dụng giao tiếp và nghệ thuật để truyền cảm hứng.",
    strengths: ["Sáng tạo", "Giao tiếp", "Lạc quan", "Kỹ năng xã hội", "Tài năng nghệ thuật"],
    challenges: ["Phân tán năng lượng", "Hời hợt", "Thay đổi tâm trạng", "Trì hoãn"],
    careerSuggestions: ["Nhà văn", "Nhà thiết kế", "Marketing", "Nghệ sĩ biểu diễn", "Nhà sáng tạo nội dung"],
    relationshipStyle: "Bạn mang lại niềm vui và sự tự phát cho các mối quan hệ, tìm kiếm người bạn đời trân trọng bản chất biểu cảm và vui tươi của bạn.",
  },
  4: {
    description: "Bạn là người xây dựng và tổ chức. Sự ổn định, cấu trúc và chăm chỉ định hình cách tiếp cận cuộc sống và sự nghiệp.",
    strengths: ["Đáng tin cậy", "Tổ chức", "Kỷ luật", "Thực tế", "Trung thành"],
    challenges: ["Cứng nhắc", "Quá thận trọng", "Nghiện công việc", "Chống lại thay đổi"],
    careerSuggestions: ["Kỹ sư", "Kế toán", "Kiến trúc sư", "Quản lý vận hành", "Lập trình viên"],
    relationshipStyle: "Bạn coi trọng sự ổn định và trung thành, xây dựng các mối quan hệ trên nền tảng tin tưởng và nỗ lực nhất quán.",
  },
  5: {
    description: "Bạn thích phiêu lưu và yêu tự do. Sự thay đổi và đa dạng thúc đẩy sự phát triển, và bạn thích ứng nhanh với tình huống mới.",
    strengths: ["Thích ứng", "Tò mò", "Đa năng", "Tháo vát", "Có sức hút"],
    challenges: ["Bồn chồn", "Bốc đồng", "Khó cam kết", "Buông thả quá mức"],
    careerSuggestions: ["Nhà báo du lịch", "Kinh doanh", "Tư vấn", "Phóng viên", "Tổ chức sự kiện"],
    relationshipStyle: "Bạn cần sự tự do và đa dạng trong các mối quan hệ, bị thu hút bởi những người chia sẻ tinh thần phiêu lưu.",
  },
  6: {
    description: "Bạn là người nuôi dưỡng và chữa lành. Trách nhiệm, gia đình và cộng đồng là trung tâm mục đích sống.",
    strengths: ["Từ bi", "Trách nhiệm", "Khả năng chữa lành", "Thẩm mỹ", "Hào phóng"],
    challenges: ["Cho đi quá nhiều", "Cầu toàn", "Xu hướng kiểm soát", "Tự bỏ quên bản thân"],
    careerSuggestions: ["Y tế", "Thiết kế nội thất", "Giáo dục", "Phi lợi nhuận", "Huấn luyện viên"],
    relationshipStyle: "Bạn tận tâm sâu sắc và biết nuôi dưỡng, tạo ra môi trường gia đình ấm áp và hài hòa cho người thân.",
  },
  7: {
    description: "Bạn là người tìm kiếm và suy tư. Con đường của bạn hướng về nội tâm, phân tích và sự hiểu biết tâm linh.",
    strengths: ["Tư duy phân tích", "Trực giác", "Kỹ năng nghiên cứu", "Trí tuệ", "Sức mạnh nội tâm"],
    challenges: ["Xu hướng cô lập", "Suy nghĩ quá nhiều", "Hoài nghi", "Xa cách cảm xúc"],
    careerSuggestions: ["Nhà nghiên cứu", "Phân tích viên", "Nhà tâm lý", "Nhà văn", "Nhà khoa học dữ liệu"],
    relationshipStyle: "Bạn cần kết nối trí tuệ và không gian cá nhân, thích các mối quan hệ sâu sắc một-một hơn vòng xã hội rộng.",
  },
  8: {
    description: "Bạn được thúc đẩy bởi thành tựu và sự thành thạo vật chất. Con đường dạy bạn cân bằng giữa tham vọng và chính trực.",
    strengths: ["Nhạy bén kinh doanh", "Uy tín", "Tầm nhìn", "Hiệu quả", "Trí tuệ tài chính"],
    challenges: ["Chủ nghĩa vật chất", "Nghiện công việc", "Tranh giành quyền lực", "Kìm nén cảm xúc"],
    careerSuggestions: ["CEO", "Cố vấn tài chính", "Bất động sản", "Luật", "Chủ doanh nghiệp"],
    relationshipStyle: "Bạn tìm kiếm người bạn đời cũng đầy tham vọng và hỗ trợ, xây dựng cặp đôi mạnh mẽ cùng nhau đạt thành tựu.",
  },
  9: {
    description: "Bạn là người nhân đạo và lý tưởng. Mục đích sống liên quan đến phụng sự người khác và làm cho thế giới tốt đẹp hơn.",
    strengths: ["Từ bi", "Lý tưởng", "Sáng tạo", "Trí tuệ", "Nhận thức toàn cầu"],
    challenges: ["Kiệt sức cảm xúc", "Xa cách", "Khó buông bỏ", "Ngây thơ"],
    careerSuggestions: ["Lãnh đạo phi lợi nhuận", "Nghệ sĩ", "Nhà trị liệu", "Công việc quốc tế", "Vận động xã hội"],
    relationshipStyle: "Bạn yêu sâu sắc và rộng lượng, đôi khi cần học cách tập trung tình yêu vào những người gần gũi.",
  },
  11: {
    description: "Số Chủ 11: Bạn là người có tầm nhìn và hướng dẫn trực giác. Nhận thức cao giúp bạn truyền cảm hứng và nâng đỡ người khác.",
    strengths: ["Tư duy tầm nhìn", "Truyền cảm hứng", "Trực giác tâm linh", "Sức hút", "Nhạy cảm"],
    challenges: ["Lo lắng", "Nghi ngờ bản thân", "Năng lượng bồn chồn", "Cảm giác quá tải"],
    careerSuggestions: ["Huấn luyện viên cuộc sống", "Giáo viên tâm linh", "Nghệ sĩ", "Tư vấn viên", "Nhà đổi mới"],
    relationshipStyle: "Bạn kết nối ở mức tâm linh sâu sắc, tìm kiếm mối quan hệ tâm hồn vượt ra ngoài bình thường.",
  },
  22: {
    description: "Số Chủ 22: Bạn là Nhà Xây Dựng Bậc Thầy, có khả năng biến ý tưởng tầm nhìn thành hiện thực hữu hình ở quy mô lớn.",
    strengths: ["Hoạch định bậc thầy", "Tầm nhìn thực tế", "Lãnh đạo", "Kỷ luật", "Truyền cảm hứng"],
    challenges: ["Áp lực lớn", "Cầu toàn", "Quá tải", "Kỳ vọng bản thân cao"],
    careerSuggestions: ["Kiến trúc sư", "CEO", "Lãnh đạo chính trị", "Nhà từ thiện", "Nhà thiết kế hệ thống"],
    relationshipStyle: "Bạn cần người bạn đời chia sẻ tầm nhìn lớn lao và hỗ trợ qua những đòi hỏi khắt khe trên con đường của bạn.",
  },
  33: {
    description: "Số Chủ 33: Bạn là Nhà Giáo Bậc Thầy, thể hiện lòng từ bi và sự chữa lành ở cấp độ cao nhất.",
    strengths: ["Sự hiện diện chữa lành", "Phụng sự vị tha", "Bậc thầy nghệ thuật", "Trí tuệ tâm linh", "Tận tâm"],
    challenges: ["Hy sinh bản thân", "Kiệt sức cảm xúc", "Lý tưởng không thực tế", "Tự hy sinh"],
    careerSuggestions: ["Nhà chữa lành", "Lãnh đạo tâm linh", "Giáo viên", "Nghệ sĩ", "Nhà nhân đạo"],
    relationshipStyle: "Bạn yêu vô điều kiện và sâu sắc, tận tâm nâng đỡ người bạn đời và tất cả mọi người xung quanh.",
  },
};

const LIFE_PATH_DATA_EN: Record<number, LifePathEntry> = {
  1: {
    description: "You are a natural-born leader with a strong drive for independence. Your path encourages you to develop self-confidence and originality.",
    strengths: ["Leadership", "Independence", "Innovation", "Determination", "Courage"],
    challenges: ["Stubbornness", "Impatience", "Overwork tendency", "Difficulty asking for help"],
    careerSuggestions: ["Entrepreneur", "Executive", "Freelancer", "Inventor", "Project Manager"],
    relationshipStyle: "You value independence in relationships and seek partners who respect your autonomy while sharing your ambitious vision.",
  },
  2: {
    description: "You are a natural diplomat and peacemaker. Your sensitivity and intuition make you excellent at understanding others' needs.",
    strengths: ["Diplomacy", "Empathy", "Cooperation", "Patience", "Attention to detail"],
    challenges: ["Oversensitivity", "Indecisiveness", "People-pleasing", "Self-doubt"],
    careerSuggestions: ["Counselor", "Mediator", "Teacher", "HR Specialist", "Social Worker"],
    relationshipStyle: "You thrive in harmonious, deeply connected partnerships and are naturally nurturing and supportive.",
  },
  3: {
    description: "You are creative, expressive, and socially vibrant. Your path is about using communication and artistry to inspire others.",
    strengths: ["Creativity", "Communication", "Optimism", "Social skills", "Artistic talent"],
    challenges: ["Scattered energy", "Superficiality", "Mood swings", "Procrastination"],
    careerSuggestions: ["Writer", "Designer", "Marketing", "Performer", "Content Creator"],
    relationshipStyle: "You bring joy and spontaneity to relationships, seeking partners who appreciate your expressive and playful nature.",
  },
  4: {
    description: "You are the builder and organizer. Stability, structure, and hard work define your approach to life and career.",
    strengths: ["Reliability", "Organization", "Discipline", "Practicality", "Loyalty"],
    challenges: ["Rigidity", "Over-cautiousness", "Workaholism", "Resistance to change"],
    careerSuggestions: ["Engineer", "Accountant", "Architect", "Operations Manager", "Developer"],
    relationshipStyle: "You value stability and loyalty, building relationships on trust and consistent effort over time.",
  },
  5: {
    description: "You are adventurous and freedom-loving. Change and variety fuel your growth, and you adapt quickly to new situations.",
    strengths: ["Adaptability", "Curiosity", "Versatility", "Resourcefulness", "Charisma"],
    challenges: ["Restlessness", "Impulsiveness", "Commitment issues", "Overindulgence"],
    careerSuggestions: ["Travel Writer", "Sales", "Consultant", "Journalist", "Event Planner"],
    relationshipStyle: "You need freedom and variety in relationships, attracted to partners who share your sense of adventure.",
  },
  6: {
    description: "You are the nurturer and healer. Responsibility, family, and community are at the center of your life purpose.",
    strengths: ["Compassion", "Responsibility", "Healing ability", "Artistic sense", "Generosity"],
    challenges: ["Over-giving", "Perfectionism", "Controlling tendencies", "Self-neglect"],
    careerSuggestions: ["Healthcare", "Interior Design", "Teaching", "Non-profit", "Coaching"],
    relationshipStyle: "You are deeply devoted and nurturing, creating warm and harmonious home environments for loved ones.",
  },
  7: {
    description: "You are the seeker and thinker. Your path is one of introspection, analysis, and spiritual understanding.",
    strengths: ["Analytical mind", "Intuition", "Research skills", "Wisdom", "Inner strength"],
    challenges: ["Isolation tendency", "Overthinking", "Skepticism", "Emotional distance"],
    careerSuggestions: ["Researcher", "Analyst", "Psychologist", "Writer", "Data Scientist"],
    relationshipStyle: "You need intellectual connection and personal space, preferring deep one-on-one bonds over social circles.",
  },
  8: {
    description: "You are driven by achievement and material mastery. Your path teaches the balance between ambition and integrity.",
    strengths: ["Business acumen", "Authority", "Vision", "Efficiency", "Financial intelligence"],
    challenges: ["Materialism", "Workaholism", "Power struggles", "Emotional suppression"],
    careerSuggestions: ["CEO", "Financial Advisor", "Real Estate", "Law", "Business Owner"],
    relationshipStyle: "You seek partners who are equally ambitious and supportive, building power couples that achieve together.",
  },
  9: {
    description: "You are the humanitarian and idealist. Your life purpose involves service to others and making the world better.",
    strengths: ["Compassion", "Idealism", "Creativity", "Wisdom", "Global awareness"],
    challenges: ["Emotional burnout", "Aloofness", "Letting go", "Naivety"],
    careerSuggestions: ["Non-profit Leader", "Artist", "Therapist", "International Work", "Advocacy"],
    relationshipStyle: "You love deeply and universally, sometimes needing to learn to focus that love on individuals close to you.",
  },
  11: {
    description: "Master Number 11: You are a visionary and intuitive guide. Your heightened awareness gives you the ability to inspire and uplift.",
    strengths: ["Visionary thinking", "Inspiration", "Spiritual insight", "Charisma", "Sensitivity"],
    challenges: ["Anxiety", "Self-doubt", "Nervous energy", "Feeling overwhelmed"],
    careerSuggestions: ["Life Coach", "Spiritual Teacher", "Artist", "Counselor", "Innovator"],
    relationshipStyle: "You connect on a deeply spiritual level, seeking soulful partnerships that transcend the ordinary.",
  },
  22: {
    description: "Master Number 22: You are the Master Builder, capable of turning visionary ideas into tangible reality on a grand scale.",
    strengths: ["Master planning", "Practical vision", "Leadership", "Discipline", "Inspiration"],
    challenges: ["Immense pressure", "Perfectionism", "Overwhelm", "High self-expectations"],
    careerSuggestions: ["Architect", "CEO", "Political Leader", "Philanthropist", "Systems Designer"],
    relationshipStyle: "You need a partner who shares your grand vision and can support you through the intense demands of your path.",
  },
  33: {
    description: "Master Number 33: You are the Master Teacher, embodying compassion and healing at the highest level.",
    strengths: ["Healing presence", "Selfless service", "Artistic mastery", "Spiritual wisdom", "Devotion"],
    challenges: ["Martyrdom", "Emotional exhaustion", "Unrealistic ideals", "Self-sacrifice"],
    careerSuggestions: ["Healer", "Spiritual Leader", "Teacher", "Artist", "Humanitarian"],
    relationshipStyle: "You love unconditionally and deeply, devoted to uplifting your partner and everyone around you.",
  },
};

export function generateNumerologyResult(fullName: string, dateOfBirth: string, lang: "vi" | "en" = "vi"): NumerologyResult {
  const lifePathNumber = calculateLifePathNumber(dateOfBirth);
  const expressionNumber = calculateExpressionNumber(fullName);
  const soulUrgeNumber = calculateSoulUrgeNumber(fullName);

  const dataMap = lang === "vi" ? LIFE_PATH_DATA_VI : LIFE_PATH_DATA_EN;
  const data = dataMap[lifePathNumber] || dataMap[1];

  return {
    lifePathNumber,
    expressionNumber,
    soulUrgeNumber,
    ...data,
  };
}
