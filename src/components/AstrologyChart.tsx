import React, { Suspense, lazy, useState, useEffect } from 'react';
import '@/styles/iztro.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calendar, Clock, User, Star, Info, Eye, EyeOff } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/lib/auth';
import { 
  translatePalaceName, 
  translateStarName, 
  translateBrightness,
  translateEarthlyBranch,
  translateHeavenlyStem,
  translateZodiac,
  translateWesternZodiac,
  translateCommon,
  translateBrightnessExplanation,
  translateFiveElement,
  getFiveElementColor,
  getStarColor
} from '@/lib/astrology-translations';

interface AstrologyResult {
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  palaces: Array<{
    name: string;
    isBodyPalace: boolean;
    isOriginalPalace: boolean;
    heavenlyStem: string;
    earthlyBranch: string;
    majorStars?: Array<{
      name: string;
      type: string;
      scope: string;
      brightness: string;
    }>;
    minorStars?: Array<{
      name: string;
      type: string;
      scope: string;
      brightness: string;
    }>;
    adjectiveStars?: Array<{
      name: string;
      type: string;
      scope: string;
    }>;
    changsheng12: string;
    boshi12: string;
    jiangqian12: string;
    suiqian12: string;
    stage?: {
      range: [number, number];
      heavenlyStem: string;
    };
    ages: number[];
  }>;
}

const LazyIztrolabe = lazy(() => import('react-iztro').then((m) => ({ default: m.Iztrolabe })));

const chineseHours = [
  { value: 0, label: 'Tí Sớm (23:00-01:00)', range: '23:00~01:00' },
  { value: 1, label: 'Sửu (01:00-03:00)', range: '01:00~03:00' },
  { value: 2, label: 'Dần (03:00-05:00)', range: '03:00~05:00' },
  { value: 3, label: 'Mão (05:00-07:00)', range: '05:00~07:00' },
  { value: 4, label: 'Thìn (07:00-09:00)', range: '07:00~09:00' },
  { value: 5, label: 'Tỵ (09:00-11:00)', range: '09:00~11:00' },
  { value: 6, label: 'Ngọ (11:00-13:00)', range: '11:00~13:00' },
  { value: 7, label: 'Mùi (13:00-15:00)', range: '13:00~15:00' },
  { value: 8, label: 'Thân (15:00-17:00)', range: '15:00~17:00' },
  { value: 9, label: 'Dậu (17:00-19:00)', range: '17:00~19:00' },
  { value: 10, label: 'Tuất (19:00-21:00)', range: '19:00~21:00' },
  { value: 11, label: 'Hợi (21:00-23:00)', range: '21:00~23:00' },
];

const palaceNames: { [key: string]: string } = {
  '财帛': 'Tài Bạch Cung',
  '子女': 'Tử Tức Cung',
  '夫妻': 'Phu Thê Cung',
  '兄弟': 'Huynh Đệ Cung',
  '命宫': 'Mệnh Cung',
  '父母': 'Phụ Mẫu Cung',
  '福德': 'Phúc Đức Cung',
  '田宅': 'Điền Trạch Cung',
  '官禄': 'Quan Lộc Cung',
  '奴仆': 'Phục Dịch Cung',
  '迁移': 'Thiên Di Cung',
  '疾厄': 'Tật Ất Cung',
};

// Translation function for palace names
const getPalaceName = (name: string): string => {
  // Try translation function first
  const translated = translatePalaceName(name);
  if (translated !== name) return translated;
  
  // Fallback to manual mapping
  return palaceNames[name] || name;
};

export default function AstrologyChart() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, saveProfile } = useUserProfile();
  const [birthDate, setBirthDate] = useState('');
  const [timeIndex, setTimeIndex] = useState(2);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [astrologyData, setAstrologyData] = useState<AstrologyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showVisualChart, setShowVisualChart] = useState(true);

  // Auto-fill user data when profile is loaded
  useEffect(() => {
    if (profile && !profileLoading) {
      // Format date for input field (YYYY-MM-DD)
      if (profile.date_of_birth) {
        const date = new Date(profile.date_of_birth);
        const formattedDate = date.toISOString().split('T')[0];
        setBirthDate(formattedDate);
      }

      // Set gender
      if (profile.gender) {
        setGender(profile.gender as 'male' | 'female');
      }

      // Parse time of birth to get time index
      if (profile.time_of_birth) {
        const timeStr = profile.time_of_birth;
        const hour = parseInt(timeStr.split(':')[0]);
        
        // Map hour to Chinese hour index
        if (hour >= 23 || hour < 1) setTimeIndex(0); // Tí
        else if (hour >= 1 && hour < 3) setTimeIndex(1); // Sửu
        else if (hour >= 3 && hour < 5) setTimeIndex(2); // Dần
        else if (hour >= 5 && hour < 7) setTimeIndex(3); // Mão
        else if (hour >= 7 && hour < 9) setTimeIndex(4); // Thìn
        else if (hour >= 9 && hour < 11) setTimeIndex(5); // Tỵ
        else if (hour >= 11 && hour < 13) setTimeIndex(6); // Ngọ
        else if (hour >= 13 && hour < 15) setTimeIndex(7); // Mùi
        else if (hour >= 15 && hour < 17) setTimeIndex(8); // Thân
        else if (hour >= 17 && hour < 19) setTimeIndex(9); // Dậu
        else if (hour >= 19 && hour < 21) setTimeIndex(10); // Tuất
        else if (hour >= 21 && hour < 23) setTimeIndex(11); // Hợi
      }
    }
  }, [profile, profileLoading]);

  const saveToProfile = async () => {
    if (!user || !birthDate) {
      setError('Vui lòng đăng nhập và chọn ngày sinh');
      return;
    }

    try {
      await saveProfile({
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
        date_of_birth: birthDate,
        time_of_birth: chineseHours[timeIndex].range.split('~')[0],
        gender: gender,
        place_of_birth: profile?.place_of_birth || '',
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving to profile:', err);
      setError('Không thể lưu thông tin vào hồ sơ');
    }
  };

  const generateChart = async () => {
    if (!birthDate) {
      setError('Vui lòng chọn ngày sinh');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { astro } = await import('iztro');
      const result = astro.astrolabeBySolarDate(birthDate, timeIndex, gender, true, 'zh-CN');
      setAstrologyData(result as unknown as AstrologyResult);
    } catch (err) {
      console.error('Error generating astrology chart:', err);
      setError('Không thể tạo lá số tử vi. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const getBrightnessColor = (brightness: string) => {
    const colors: { [key: string]: string } = {
      '庙': 'bg-purple-100 text-purple-800',
      '旺': 'bg-red-100 text-red-800',
      '得': 'bg-blue-100 text-blue-800',
      '利': 'bg-green-100 text-green-800',
      '平': 'bg-yellow-100 text-yellow-800',
      '不': 'bg-gray-100 text-gray-800',
      '陷': 'bg-orange-100 text-orange-800',
    };
    return colors[brightness] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {profile && !profileLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Dữ liệu tự động điền từ hồ sơ:</p>
                <ul className="text-blue-700 mt-1 space-y-1">
                  {profile.date_of_birth && <li>• Ngày sinh: {profile.date_of_birth}</li>}
                  {profile.time_of_birth && <li>• Giờ sinh: {profile.time_of_birth}</li>}
                  {profile.gender && <li>• Giới tính: {profile.gender === 'male' ? 'Nam' : 'Nữ'}</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6" />
            Tạo Lá Số Tử Vi
            {profile && !profileLoading && (
              <Badge variant="secondary" className="text-xs">
                Đã tự động điền
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Nhập thông tin sinh để tạo lá số tử vi chi tiết
            {profile && !profileLoading && (
              <span className="block text-green-600 mt-1">
                ✅ Dữ liệu đã được tự động điền từ hồ sơ của bạn
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ngày sinh (Dương lịch)
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Giờ sinh
              </Label>
              <Select value={timeIndex.toString()} onValueChange={(value) => setTimeIndex(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giờ sinh" />
                </SelectTrigger>
                <SelectContent>
                  {chineseHours.map((hour) => (
                    <SelectItem key={hour.value} value={hour.value.toString()}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Giới tính
              </Label>
              <Select value={gender} onValueChange={(value: 'male' | 'female') => setGender(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          {saveSuccess && (
            <div className="text-green-600 text-sm">
              ✅ Đã lưu thông tin vào hồ sơ thành công!
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={generateChart} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Đang tạo lá số...' : 'Tạo Lá Số'}
            </Button>
            
            {user && (
              <Button 
                onClick={saveToProfile}
                variant="outline"
                disabled={!birthDate}
              >
                Lưu vào hồ sơ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {astrologyData && (
        <div className="space-y-6">
          {/* View Toggle */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Chế độ hiển thị:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={showVisualChart ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowVisualChart(true)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Biểu đồ trực quan
                    </Button>
                    <Button
                      variant={!showVisualChart ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowVisualChart(false)}
                      className="flex items-center gap-1"
                    >
                      <EyeOff className="h-4 w-4" />
                      Dữ liệu chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Chart */}
          {showVisualChart && (
            <Card>
              <CardHeader>
                <CardTitle>Biểu đồ Tử vi Trực quan</CardTitle>
                <CardDescription>
                  Biểu đồ 12 cung tử vi với các ngôi sao và thông tin chi tiết
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center overflow-x-auto">
                  <div style={{ width: 1024, maxWidth: '100%' }}>
                    <Suspense fallback={<div className="w-full aspect-[4/3] bg-muted" />}>
                      <LazyIztrolabe 
                        birthday={birthDate} 
                        birthTime={timeIndex} 
                        birthdayType="solar" 
                        gender={gender}
                        lang="vi-VN"
                        horoscopeDate={new Date()}
                        horoscopeHour={0}
                      />
                    </Suspense>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Data */}
          {!showVisualChart && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Cơ Bản</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">{translateCommon('阳历')}</Label>
                      <p className="font-semibold">{astrologyData.solarDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">{translateCommon('阴历')}</Label>
                      <p className="font-semibold">{translateCommon(astrologyData.lunarDate) || astrologyData.lunarDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">{translateCommon('时辰')}</Label>
                      <p className="font-semibold">{translateCommon(astrologyData.time) || astrologyData.time} ({astrologyData.timeRange})</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Cung mệnh</Label>
                      <p className="font-semibold">{translateStarName(astrologyData.soul)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Tứ trụ</Label>
                      <p className="font-semibold">{translateCommon(astrologyData.chineseDate) || astrologyData.chineseDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Cung thân</Label>
                      <p className="font-semibold">{translateStarName(astrologyData.body)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">{translateCommon('五行局')}</Label>
                      <p className="font-semibold">{translateCommon(astrologyData.fiveElementsClass) || translateFiveElement(astrologyData.fiveElementsClass)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Giáp tý</Label>
                      <p className="font-semibold">{translateZodiac(astrologyData.zodiac)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{translateCommon('12 Cung Tử Vi')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {astrologyData?.palaces?.map((palace) => (
                  <Card key={`${palace.name}-${palace.heavenlyStem}-${palace.earthlyBranch}`} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">
                          {getPalaceName(palace.name)}
                        </h3>
                        <div className="flex gap-1">
                          {palace.isBodyPalace && (
                            <Badge variant="outline" className="text-xs">{translateCommon('Thân')}</Badge>
                          )}
                          {palace.isOriginalPalace && (
                            <Badge variant="outline" className="text-xs">{translateCommon('Mệnh')}</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {translateHeavenlyStem(palace.heavenlyStem)} {translateEarthlyBranch(palace.earthlyBranch)}
                      </div>

                      {palace.majorStars && palace.majorStars.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs font-medium">{translateCommon('Chính tinh:')}</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {palace.majorStars.map((star) => (
                              <Badge 
                                key={`${star.name}-${star.scope}-${star.type}-${star.brightness}`} 
                                className={`text-xs ${getBrightnessColor(star.brightness)} ${getStarColor(star.name)}`}
                              >
                                {translateStarName(star.name)}
                                {star.brightness && ` (${translateBrightness(star.brightness)})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {palace.minorStars && palace.minorStars.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs font-medium">{translateCommon('Phụ tinh:')}</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {palace.minorStars.map((star) => (
                              <Badge 
                                key={`${star.name}-${star.scope}-${star.type}-${star.brightness}`} 
                                variant="outline"
                                className={`text-xs ${getStarColor(star.name)}`}
                              >
                                {translateStarName(star.name)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {palace.adjectiveStars && palace.adjectiveStars.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs font-medium">{translateCommon('Tạp tinh:')}</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {palace.adjectiveStars.map((star, starIndex) => (
                              <Badge 
                                key={starIndex} 
                                variant="secondary"
                                className={`text-xs ${getStarColor(star.name)}`}
                              >
                                {translateStarName(star.name)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator className="my-2" />
                      
                      <div className="text-xs text-gray-500">
                        {palace.stage && palace.stage.range && (
                          <div>Đại hạn: {palace.stage.range[0]}-{palace.stage.range[1]} tuổi</div>
                        )}
                        {palace.stage && palace.stage.heavenlyStem && (
                          <div>Thiên can: {palace.stage.heavenlyStem}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
            </>
          )}

          {/* Brightness Legend */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Chú thích cường độ sao</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-purple-100 text-purple-800">M</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('M')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-red-100 text-red-800">V</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('V')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-blue-100 text-blue-800">D</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('D')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-green-100 text-green-800">L</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('L')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-yellow-100 text-yellow-800">B</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('B')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-gray-100 text-gray-800">H</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('H')}</div>
                </div>
                <div className="text-center">
                  <Badge className="w-full justify-center mb-1 bg-orange-100 text-orange-800">X</Badge>
                  <div className="text-gray-600">{translateBrightnessExplanation('X')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Five Elements Legend */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Ngũ hành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <Badge className={`w-full justify-center mb-1 ${getFiveElementColor('Mộc')}`}>Mộc</Badge>
                  <div className="text-gray-600">Mộc (Cây)</div>
                </div>
                <div className="text-center">
                  <Badge className={`w-full justify-center mb-1 ${getFiveElementColor('Hỏa')}`}>Hỏa</Badge>
                  <div className="text-gray-600">Hỏa (Lửa)</div>
                </div>
                <div className="text-center">
                  <Badge className={`w-full justify-center mb-1 ${getFiveElementColor('Thổ')}`}>Thổ</Badge>
                  <div className="text-gray-600">Thổ (Đất)</div>
                </div>
                <div className="text-center">
                  <Badge className={`w-full justify-center mb-1 ${getFiveElementColor('Kim')}`}>Kim</Badge>
                  <div className="text-gray-600">Kim (Kim loại)</div>
                </div>
                <div className="text-center">
                  <Badge className={`w-full justify-center mb-1 ${getFiveElementColor('Thủy')}`}>Thủy</Badge>
                  <div className="text-gray-600">Thủy (Nước)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Star Colors Legend */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Màu sắc sao theo ngũ hành</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div className="w-full h-8 bg-green-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-green-600 font-semibold">Mộc</span>
                  </div>
                  <div className="text-gray-600">Mộc (Xanh lá)</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-8 bg-red-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-red-600 font-semibold">Hỏa</span>
                  </div>
                  <div className="text-gray-600">Hỏa (Đỏ)</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-8 bg-yellow-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold">Thổ</span>
                  </div>
                  <div className="text-gray-600">Thổ (Vàng)</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-8 bg-gray-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">Kim</span>
                  </div>
                  <div className="text-gray-600">Kim (Xám)</div>
                </div>
                <div className="text-center">
                  <div className="w-full h-8 bg-blue-100 rounded mb-1 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">Thủy</span>
                  </div>
                  <div className="text-gray-600">Thủy (Xanh dương)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
