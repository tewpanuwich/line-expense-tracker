import type { Metadata } from "next";
import { Anuphan, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { getCurrentMember } from "@/lib/auth/session-server";
import { BottomNav } from "@/components/bottom-nav";

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "family-expense-tracker",
  description: "บันทึกรายจ่ายในครอบครัว",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const member = await getCurrentMember();

  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <div className="flex flex-1 flex-col">{children}</div>
        {member && <BottomNav isAdmin={member.is_admin} />}
      </body>
    </html>
  );
}
