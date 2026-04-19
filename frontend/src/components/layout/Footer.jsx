const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AttendAI. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
            Privacy Policy
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
            Terms of Service
          </a>
          <a href="#" className="text-sm text-gray-500 hover:text-primary-600">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
