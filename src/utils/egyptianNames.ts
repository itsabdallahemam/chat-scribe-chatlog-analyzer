// Egyptian names data from CSV
const egyptianNames = [
  "Engy Abdelrahman", "Tariq Zaki", "Omar Khaled", "Rana Ali", "Dina Mahmoud",
  "Reem Abdallah", "Ahmed Saad", "Nada Selim", "Reem Zaki", "Ibrahim Hassan",
  "Tamer Nassar", "Nada Tawfik", "Sherif Zaki", "Hassan Reda", "Dina Reda",
  "Fady Fathy", "Rania Ibrahim", "Dina Mostafa", "Sherif Gaber", "Ahmed Youssef",
  "Ziad Abdallah", "Hassan Ibrahim", "Tamer Mostafa", "Tariq Saad", "Engy Mostafa",
  "Ayman Khaled", "Ayman Ahmed", "Engy Hassan", "Ahmed Gaber", "Ayman Saad",
  "Amr Ahmed", "Nader Reda", "Fady Ahmed", "Aya Tawfik", "Mohamed Ali",
  "Dina Gaber", "Habiba Selim", "Reem Mahmoud", "Reem Saad", "Ayman Ibrahim",
  "Farah Abdelrahman", "Wael Abdallah", "Aya Ibrahim", "Engy Nassar", "Heba Mostafa"
];

export const getRandomEgyptianName = (): string => {
  return egyptianNames[Math.floor(Math.random() * egyptianNames.length)];
}; 