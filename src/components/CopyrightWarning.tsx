function CopyrightWarning() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-sm text-gray-500">
        © [{currentYear}] The Art Institute of Chicago. All rights reserved.
      </p>
    </div>
  );
}

export default CopyrightWarning;