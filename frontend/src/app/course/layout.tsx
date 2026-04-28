import CourseLayoutClient from "./CourseLayoutClient";

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CourseLayoutClient>{children}</CourseLayoutClient>;
}
