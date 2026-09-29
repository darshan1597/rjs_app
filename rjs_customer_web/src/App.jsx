import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RideBooking from './pages/RideBooking.jsx'
import Packages from './pages/Packages.jsx'
import DestinationDetails from './pages/DestinationDetails.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'
import MyBookings from './pages/MyBookings.jsx'
import LegalPage from './pages/LegalPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import MapLocationPicker from './pages/MapLocationPicker.jsx'
import RideReview from './pages/RideReview.jsx'
import BookingStatus from './pages/BookingStatus.jsx'

export default function App(){
    const location=useLocation()
    useEffect(()=>{
        if(location.hash) requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({behavior:'smooth'}))
        else window.scrollTo({top:0,left:0,behavior:'instant'})
    },[location.pathname,location.hash])
    useEffect(()=>{
        let observer
        const frame=requestAnimationFrame(()=>{
            const targets=document.querySelectorAll('.packages-heading,.package-card,.all-packages-head,.all-packages-grid>article,.fleet-section .section-title,.vehicle-card,.experience-grid>*,.routes .section-title,.route-grid>article,.corporate-inner>*,[data-result-card],.detail-section,.booking-summary,.form-card,.trip-summary')
            targets.forEach(target=>target.classList.add('scroll-reveal'))
            observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
                if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}
            }),{threshold:.12,rootMargin:'0px 0px -45px'})
            targets.forEach(target=>observer.observe(target))
        })
        return()=>{cancelAnimationFrame(frame);observer?.disconnect()}
    },[location.pathname])
    return (
        <div className="route-stage" key={location.pathname}>
            <Routes location={location}>
                <Route path="/" element={<Home/>}/>
                <Route path="/available-vehicles" element={<RideBooking/>}/>
                <Route path="/book" element={<RideBooking/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/signup" element={<SignUp/>}/>
                <Route path="/contact" element={<Contact/>}/>
                <Route path="/about" element={<About/>}/>
                <Route path="/my-bookings" element={<MyBookings/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>
                <Route path="/select-location/:field" element={<MapLocationPicker/>}/>
                <Route path="/ride-review" element={<RideReview/>}/>
                <Route path="/booking-status/:bookingId" element={<BookingStatus/>}/>
                <Route path="/terms" element={<LegalPage type="terms"/>}/>
                <Route path="/privacy" element={<LegalPage type="privacy"/>}/>
                <Route path="/cancellation-refunds" element={<LegalPage type="cancellation"/>}/>
                <Route path="/account-deletion" element={<LegalPage type="deletion"/>}/>
                <Route path="/packages" element={<Packages/>}/>
                <Route path="/packages/:slug" element={<DestinationDetails/>}/>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </div>
    )
}
