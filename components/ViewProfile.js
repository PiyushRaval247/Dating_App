import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Image,
  ScrollView,
} from 'react-native';
import React, {useContext} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import Feather from '@react-native-vector-icons/feather';
import Entypo from '@react-native-vector-icons/entypo';
import ImageCarousel from './ImageCarousel';

const ViewProfile = ({userInfo}) => {
  const {userInfo: currentUserInfo} = useContext(AuthContext);
  const images = Array.isArray(userInfo?.imageUrls)
    ? userInfo.imageUrls.filter(url => typeof url === 'string' && url.trim() !== '')
    : [];
  return (
    <ScrollView>
      <View style={{marginHorizontal: 12, marginVertical: 12}}>
        <>
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <Text style={{fontSize: 22, fontWeight: 'bold'}}>
                  {userInfo?.firstName}
                </Text>
                <View
                  style={{
                    backgroundColor: '#452c63',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 20,
                  }}>
                  <Text style={{textAlign: 'center', color: 'white'}}>
                    new here
                  </Text>
                </View>
              </View>

              <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <Entypo name="dots-three-horizontal" size={22} color="black" />
              </View>
            </View>

            <View style={{marginVertical: 15}}>
              {/* Photo carousel */}
              <View>
                <ImageCarousel images={images} height={400} borderRadius={10} />
              </View>
            </View>

            <View style={{marginVertical: 15}}>
              {userInfo?.prompts?.slice(0, 1).map((prompt, index) => (
                <React.Fragment key={prompt?.id ?? String(index)}>
                  <View
                    style={{
                      backgroundColor: 'white',
                      padding: 12,
                      borderRadius: 10,
                      height: 150,
                      justifyContent: 'center',
                    }}>
                    <Text style={{fontSize: 15, fontWeight: '500'}}>
                      {prompt.question}
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginTop: 20,
                        fontFamily: 'Carlito',
                        lineHeight: 30,
                      }}>
                      {prompt.answer}
                    </Text>
                  </View>
                  {/* removed like overlay to keep profile purely informational */}
                </React.Fragment>
              ))}
            </View>

            <View
              style={{
                backgroundColor: 'white',
                padding: 10,
                borderRadius: 8,
              }}>
              <ScrollView
                style={{}}
                horizontal
                showsHorizontalScrollIndicator={false}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginRight: 20,
                  }}>
                  {/* <MaterialCommunityIcons
                    name="cake-variant-outline"
                    size={22}
                    color="black"
                  /> */}
                  <Text style={{fontSize: 15}}>{userInfo?.dateOfBirth}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginRight: 20,
                  }}>
                  <Ionicons name="person-outline" size={22} color="black" />
                  <Text style={{fontSize: 15}}>{userInfo?.gender}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginRight: 20,
                  }}>
                  <Ionicons name="magnet-outline" size={22} color="black" />
                  <Text style={{fontSize: 15}}>{userInfo?.type}</Text>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                  {/* <Octicons name="home" size={22} color="black" /> */}
                  <Text style={{fontSize: 15}}>{userInfo?.hometown}</Text>
                </View>
              </ScrollView>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.8,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                  marginTop: 20,
                }}>
                <Ionicons name="bag-outline" size={20} color="black" />
                <Text>{userInfo?.jobTitle}</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.8,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                }}>
                <Ionicons name="locate-outline" size={20} color="black" />
                <Text>{userInfo?.workPlace}</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.8,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                }}>
                <Ionicons name="book-outline" size={22} color="black" />
                <Text>Hindu</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.8,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                }}>
                <Ionicons name="home-outline" size={20} color="black" />
                <Text>{userInfo?.location}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.7,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                }}>
                <Ionicons name="search-outline" size={20} color="black" />
                <Text>{userInfo?.lookingFor}</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 15,
                  borderBottomWidth: 0.7,
                  borderBottomColor: '#E0E0E0',
                  paddingBottom: 10,
                }}>
                <Ionicons name="heart-outline" size={20} color="black" />
                <Text>Monogamy</Text>
              </View>
            </View>

            <View>{null}</View>

            <View style={{marginVertical: 15}}>
              {userInfo?.prompts?.slice(1, 2).map(prompt => (
                <>
                  <View
                    key={prompt.id}
                    style={{
                      backgroundColor: 'white',
                      padding: 12,
                      borderRadius: 10,
                      height: 150,
                      justifyContent: 'center',
                    }}>
                    <Text style={{fontSize: 15, fontWeight: '500'}}>
                      {prompt.question}
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginTop: 20,
                        fontFamily: 'Carlito',
                        lineHeight: 30,
                      }}>
                      {prompt.answer}
                    </Text>
                  </View>
                  {/* removed like overlay to keep profile purely informational */}
                </>
              ))}
            </View>

            <View>{null}</View>
            <View style={{marginVertical: 15}}>
              {userInfo?.prompts?.slice(2, 3).map(prompt => (
                <>
                  <View
                    key={prompt.id}
                    style={{
                      backgroundColor: 'white',
                      padding: 12,
                      borderRadius: 10,
                      height: 150,
                      justifyContent: 'center',
                    }}>
                    <Text style={{fontSize: 15, fontWeight: '500'}}>
                      {prompt.question}
                    </Text>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginTop: 20,
                        fontFamily: 'Carlito',
                        lineHeight: 30,
                      }}>
                      {prompt.answer}
                    </Text>
                  </View>
                  {/* removed like overlay to keep profile purely informational */}
                </>
              ))}
            </View>

            <View>{null}</View>
          </View>
        </>
      </View>
    </ScrollView>
  );
};

export default ViewProfile;

const styles = StyleSheet.create({});
import {AuthContext} from '../AuthContext';
