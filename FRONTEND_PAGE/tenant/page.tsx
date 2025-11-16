"use client";

import Image from 'next/image'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react'
import { useState } from 'react'

export default function page() {
  const [username, inUsername] = useState("");
  const [password, inPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const router = useRouter();
  const handleLogin = async () => {
    if (!username || !password || !agree) {
      alert("Please enter username, password, and agree to terms.");
      return;
    }

    try {
      const response = await fetch('https://testapi.notonoty.me/api/tenant/auth', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data);
        alert('Login successful!');
        //create session storage item
        sessionStorage.setItem('username', username);
        router.push('/tenant/home');
      } else {
        alert(`Login failed: ${data.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };


  return (
   
      <div className='bg-[#F2E9DD] w-full h-fit'>

        <div className='relative w-full h-60'>
          <Image className='object-contain' src={'/AutoLocate_logo 1.png'} alt={'logo'} fill />
        </div>

        <div className=' flex flex-col items-center bg-[#344E60] w-full h-full rounded-t-[10vw]'>
          <h1 className='mt-25 text-5xl text-white font-league-spartan'>Hello Resident!</h1>
          
          <div className='relative flex w-[80%] h-[80px] mt-[40px] bg-[#D9D9D9] rounded-full'> 
            <Image className='object-contain mx-[30px]' src={'/usernameIcon.png'} alt={'username icon'} width={45} height={45}/>
            <input
              value = {username}
              onChange={e => inUsername(e.target.value)} 
              placeholder='Username'
              className='placeholder:text-[#344E60]-50 text-[32px] w-full h-full font-league-spartan'
            />
          </div>

            <div className='relative flex w-[80%] h-[80px] mt-[20px] bg-[#D9D9D9] rounded-full'> 
            <Image className='object-contain mx-[30px]' src={'/passwordIcon.png'} alt={'username icon'} width={45} height={45}/>
            <input
              type="password"
              value={password}
              onChange={e => inPassword(e.target.value)} 
              placeholder='Password'
              className='placeholder:text-[#344E60]-50 text-[32px] w-full h-full font-league-spartan'
            />
            </div>
          
          <div className='flex gap-3 items-center mt-3'>
            <input 
            id = "agree" 
            type="checkbox"
            checked = {agree}
            onChange={e => setAgree(e.target.checked)}
            className='w-5 h-5'
            />
            <div className='text-center font-league-spartan'>I agree to the <span className='underline text-[#44ACCF]'>Terms of Service</span> and <br /><span className='underline text-[#44ACCF]'>Privacy Policy</span></div>
          </div>

          <button
            onClick={handleLogin}
            className='mt-[120px] mb-[70px] rounded-full w-[80%] h-[80px] bg-[#44ACCF] text-[42px] text-white font-bold font-league-spartan active:bg-[#2A8FBE]'
          >
            Login
          </button>
          

        </div>
      
      </div>


    
  )
}
