"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Trophy,
  TrendingUp,
  Clock,
  Edit3,
  Save,
  X,
  Camera
} from "lucide-react";

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "김민준",
    email: "kimminjun@example.com",
    profileImage: "/placeholder-avatar.jpg"
  });
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    profileImage: ""
  });

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  const handleEditClick = () => {
    setEditData({ ...profileData });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    setProfileData({ ...editData });
    setIsEditModalOpen(false);
    alert("프로필이 저장되었습니다!");
  };

  const handleCancelEdit = () => {
    setEditData({ ...profileData });
    setIsEditModalOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditData({ ...editData, profileImage: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 과목별 성취도 데이터
  const subjectStats = [
    { name: "수학", percentage: 88, color: "blue", problems: 45 },
    { name: "과학", percentage: 75, color: "purple", problems: 32 },
    { name: "영어", percentage: 60, color: "green", problems: 28 },
    { name: "국어", percentage: 100, color: "orange", problems: 15 }
  ];

  // 최근 활동 데이터
  const recentActivities = [
    { 
      id: 1, 
      title: "이차방정식 문제", 
      subject: "수학", 
      date: "2024-01-31", 
      status: "완료", 
      isCorrect: true 
    },
    { 
      id: 2, 
      title: "물질의 상태 문제", 
      subject: "과학", 
      date: "2024-01-14", 
      status: "완료", 
      isCorrect: false 
    },
    { 
      id: 3, 
      title: "삼차함수 문제", 
      subject: "수학", 
      date: "2024-01-13", 
      status: "완료", 
      isCorrect: true 
    },
    { 
      id: 4, 
      title: "논술 문제", 
      subject: "국어", 
      date: "2024-01-12", 
      status: "완료", 
      isCorrect: true 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation 
        isLoggedIn={isLoggedIn} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">마이페이지</h1>
          <p className="text-gray-600 dark:text-gray-300">학습 현황과 통계를 확인하고 관리하세요</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* 왼쪽 프로필 섹션 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 프로필 카드 */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="relative">
                  <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
                    <AvatarImage src={profileData.profileImage} alt="프로필 사진" />
                    <AvatarFallback className="text-lg bg-blue-500 text-white">{profileData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 right-1/2 transform translate-x-1/2">
                    <div className="w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{profileData.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{profileData.email}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-4">가입일: 2024-01-31</p>
                
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">Lv.5</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">레벨</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">12일</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">연속 학습</div>
                  </div>
                </div>

                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={handleEditClick}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      프로필 수정
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">프로필 수정</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* 프로필 사진 변경 */}
                      <div className="text-center">
                        <div className="relative inline-block">
                          <Avatar className="w-20 h-20 mx-auto">
                            <AvatarImage src={editData.profileImage} alt="프로필 사진" />
                            <AvatarFallback className="text-lg bg-blue-500 text-white">
                              {editData.name.charAt(0) || "김"}
                            </AvatarFallback>
                          </Avatar>
                          <label 
                            htmlFor="profileImage" 
                            className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Camera className="w-3 h-3 text-white" />
                          </label>
                          <input
                            id="profileImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">클릭하여 사진 변경</p>
                      </div>

                      {/* 이름 변경 */}
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-900 dark:text-white">이름</Label>
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="이름을 입력하세요"
                        />
                      </div>

                      {/* 이메일 변경 */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-900 dark:text-white">이메일</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="이메일을 입력하세요"
                        />
                      </div>

                      {/* 버튼들 */}
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          onClick={handleSaveProfile} 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          <X className="w-4 h-4 mr-2" />
                          취소
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* 학습 통계 카드 */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
                  학습 통계
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">45%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">오늘 목표</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">84.4%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">정답률</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">38%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">월간</div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">7%</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">연간</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 메인 컨텐츠 */}
          <div className="lg:col-span-3 space-y-6">
            {/* 과목별 성취도 */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
                  과목별 성취도
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">각 과목별 문제 풀이 통계를 확인하세요</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjectStats.map((subject) => (
                  <div key={subject.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{subject.problems}문제</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{subject.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          subject.color === 'blue' ? 'bg-blue-600' :
                          subject.color === 'purple' ? 'bg-purple-600' :
                          subject.color === 'green' ? 'bg-green-600' :
                          'bg-orange-600'
                        }`}
                        style={{ width: `${subject.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 최근 활동 */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  최근 활동
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">최근 7일간의 문제 풀이 기록을 확인하세요</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${activity.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{activity.subject}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.isCorrect 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {activity.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
