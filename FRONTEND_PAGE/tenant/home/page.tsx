"use client";

import Image from 'next/image'
import React, { useEffect, useState } from 'react'

export default function page() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [license_number, setLicenseNumber] = useState<string | null>(null);
  const [parking_slot_id, setParkingSlotId] = useState<string | null>(null);
  const [floor, setFloor] = useState<string | null>(null);


  useEffect(() =>{
    const storedUsername = sessionStorage.getItem('username');

    if (storedUsername){
      setUsername(storedUsername);

      const response = async ()=>{
        try{
          console.log("Fetching data for username: ", storedUsername);
          
          const response = await fetch('https://testapi.notonoty.me/api/tenant/carlocation',{
            method: 'POST',
            credentials: 'include',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: storedUsername }),
          });
              
          const data = await response.json();

          if(response.ok){
            // Handle the data as needed
            setLicenseNumber(data.carLocations[0].license_number);
            setParkingSlotId(data.carLocations[0].parking_slot_id);
            setFloor(data.carLocations[0].floor);
            console.log("data: ", data);
          } else {
            throw new Error(data.error || 'Failed to fetch tenant data');
          }
          

        } catch (err:any){
          console.error("Error details:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
      }
    };
      response();
    } else {
      setIsLoading(false);
      setError('No username found in session storage');
    }

  },[]);

  if (isLoading){
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  }
  
 console.log("Lisense Plate Number: ", license_number);

  return (
    <div className='bg-[#F2E9DD] w-full h-fit'>
      <div className='relative w-full h-40'>
        <Image className='object-contain' src={'/AutoLocate_logo 1.png'} alt={'logo'} fill />
      </div>
      <div className='flex flex-col items-center bg-[#344E60] w-full h-full rounded-t-[10vw]'>
        <div className='mt-7 flex flex-col items-center bg-[#F2E9DD] rounded-[10vw] w-[90%]'>
          <h1 className='mt-3 text-xl text-[#344E60] font-league-spartan'>Your lisense plate number:</h1>
          <h1>{license_number}</h1>
        </div>

      </div>


    </div>
  )
}
