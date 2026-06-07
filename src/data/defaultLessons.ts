import { Lesson } from "../types";

export const defaultLessons: Lesson[] = Array.from({ length: 30 }, (_, index) => {
  const day = index + 1;
  return {
    id: day,
    day: day,
    title: `Өдөр ${day} - Япон хэлний хичээл`,
    theme: day <= 10 ? "Анхан шат" : day <= 20 ? "Дунд шат" : "Ахисан шат",
    listeningUrl: "https://www.youtube.com/embed/L1mCHdfLp5U", // High-quality educational Japanese listening video
    vocabQuestions: [
      {
        question: `[Өдөр ${day}] "としょかん" гэх үг япон ширээний ханзаар аль нь вэ?`,
        options: ["図書館", "体育館", "映画館", "美術館"],
        answerIndex: 0,
        explanation: "としょかん гэдэг нь Номын сан гэсэн утгатай бөгөөд '図書館' гэж бичнэ."
      },
      {
        question: `[Өдөр ${day}] "Surprise" буюу Гайхах гэсэн утгатай үгийг сонгоно уу.`,
        options: ["おどろく", "おこる", "よろこぶ", "かなしむ"],
        answerIndex: 0,
        explanation: "おどろく (odoroku) гэдэг нь гайхах гэсэн утгатай үйл үг юм."
      }
    ],
    grammarQuestions: [
      {
        question: `[Өдөр ${day}] "Туршиж үзэх" (~te miru) холбох нөхцөлийг сонгоно уу.`,
        options: ["食べてみます", "食べなければならない", "食べないでください", "食べるそうです"],
        answerIndex: 0,
        explanation: "Verb(Te-form) + みる нь ямар нэгэн үйлийг туршиж үзэх гэсэн утга илэрхийлнэ."
      },
      {
        question: `[Өдөр ${day}] 'Хэрвээ ... бол' гэсэн утгатай дүрмийн нөхцөл аль нь вэ?`,
        options: ["~たら", "~ながら", "~つづける", "~すぎる"],
        answerIndex: 0,
        explanation: "~たら нөхцөл нь хэрвээ/болбол гэсэн нөхцөлт утга илэрхийлнэ."
      }
    ]
  };
});
